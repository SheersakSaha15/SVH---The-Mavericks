import asyncio
import logging
from typing import Optional
from fastapi import HTTPException, status
from starlette.concurrency import run_in_threadpool
from supabase import create_client, Client

try:
    from backend.config import settings
    from backend.models import SignUpRequest, SignInRequest, UserProfile, AuthResponse, UpdateProfileRequest
except ImportError:
    from config import settings
    from models import SignUpRequest, SignInRequest, UserProfile, AuthResponse, UpdateProfileRequest

logger = logging.getLogger("healthbridge-backend")

class SupabaseAuthService:
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_ANON_KEY
        self.client: Client = create_client(self.url, self.key)

    async def _run_with_timeout(self, func, *args, timeout: float = 5.0, **kwargs):
        """
        Runs a synchronous blocking function in a separate thread pool with strict timeout.
        """
        try:
            return await asyncio.wait_for(run_in_threadpool(func, *args, **kwargs), timeout=timeout)
        except asyncio.TimeoutError:
            logger.warning(f"Supabase call {getattr(func, '__name__', 'operation')} timed out after {timeout}s")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Authentication provider request timed out. Please check network connection or Supabase project status."
            )

    async def sign_up(self, request: SignUpRequest) -> AuthResponse:
        """
        Registers a new user in Supabase Auth & feeds profile details into Supabase DB.
        """
        try:
            user_metadata = {
                "full_name": request.full_name or "",
                "phone": request.phone or "",
                "preferred_language": request.preferred_language or "en"
            }
            
            signup_payload = {
                "email": request.email,
                "password": request.password,
                "options": {
                    "data": user_metadata
                }
            }
            
            response = await self._run_with_timeout(self.client.auth.sign_up, signup_payload, timeout=6.0)
            
            if not response or not response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to register user with Supabase."
                )

            user_id = response.user.id
            email = response.user.email or request.email

            # Attempt to feed data into 'profiles' table in Supabase DB if enabled
            try:
                profile_data = {
                    "id": user_id,
                    "email": email,
                    "full_name": request.full_name,
                    "phone": request.phone,
                    "preferred_language": request.preferred_language or "en"
                }
                await self._run_with_timeout(
                    lambda: self.client.table("profiles").upsert(profile_data).execute(),
                    timeout=3.0
                )
            except Exception as db_err:
                logger.warning(f"Could not upsert to Supabase 'profiles' table: {db_err}")

            user_profile = UserProfile(
                id=user_id,
                email=email,
                full_name=request.full_name,
                phone=request.phone,
                preferred_language=request.preferred_language or "en",
                created_at=str(getattr(response.user, "created_at", ""))
            )

            access_token = None
            refresh_token = None
            expires_in = None

            if response.session:
                access_token = response.session.access_token
                refresh_token = response.session.refresh_token
                expires_in = response.session.expires_in
                message = "Sign up successful."
            else:
                message = "Sign up successful. Please check your email to confirm registration."

            return AuthResponse(
                success=True,
                message=message,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=expires_in,
                user=user_profile
            )

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Supabase Sign Up Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    async def sign_in(self, request: SignInRequest) -> AuthResponse:
        """
        Authenticates user with Supabase Auth using email & password.
        Crosschecks credentials against Supabase and returns JWT token.
        """
        try:
            signin_payload = {
                "email": request.email,
                "password": request.password
            }
            response = await self._run_with_timeout(
                self.client.auth.sign_in_with_password,
                signin_payload,
                timeout=6.0
            )

            if not response or not response.session or not response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password."
                )

            session = response.session
            user = response.user
            user_meta = user.user_metadata or {}

            full_name = user_meta.get("full_name")
            phone = user_meta.get("phone")
            preferred_language = user_meta.get("preferred_language", "en")

            try:
                db_res = await self._run_with_timeout(
                    lambda: self.client.table("profiles").select("*").eq("id", user.id).execute(),
                    timeout=3.0
                )
                if db_res and db_res.data and len(db_res.data) > 0:
                    prof = db_res.data[0]
                    full_name = prof.get("full_name") or full_name
                    phone = prof.get("phone") or phone
                    preferred_language = prof.get("preferred_language") or preferred_language
            except Exception as db_err:
                logger.debug(f"Profiles table lookup skipped: {db_err}")

            user_profile = UserProfile(
                id=user.id,
                email=user.email or request.email,
                full_name=full_name,
                phone=phone,
                preferred_language=preferred_language,
                created_at=str(getattr(user, "created_at", ""))
            )

            return AuthResponse(
                success=True,
                message="Sign in successful.",
                access_token=session.access_token,
                refresh_token=refresh_token,
                expires_in=session.expires_in,
                user=user_profile
            )

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Supabase Sign In Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {str(e)}"
            )

    async def get_current_user(self, access_token: str) -> UserProfile:
        """
        Validates incoming JWT access token with Supabase Auth and returns UserProfile.
        """
        try:
            response = await self._run_with_timeout(
                self.client.auth.get_user,
                access_token,
                timeout=5.0
            )
            if not response or not response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired JWT authentication token."
                )

            user = response.user
            user_meta = user.user_metadata or {}

            full_name = user_meta.get("full_name")
            phone = user_meta.get("phone")
            preferred_language = user_meta.get("preferred_language", "en")

            try:
                db_res = await self._run_with_timeout(
                    lambda: self.client.table("profiles").select("*").eq("id", user.id).execute(),
                    timeout=3.0
                )
                if db_res and db_res.data and len(db_res.data) > 0:
                    prof = db_res.data[0]
                    full_name = prof.get("full_name") or full_name
                    phone = prof.get("phone") or phone
                    preferred_language = prof.get("preferred_language") or preferred_language
            except Exception as db_err:
                logger.debug(f"Profiles table lookup skipped: {db_err}")

            return UserProfile(
                id=user.id,
                email=user.email or "",
                full_name=full_name,
                phone=phone,
                preferred_language=preferred_language,
                created_at=str(getattr(user, "created_at", ""))
            )
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"JWT Validation Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired JWT token."
            )

    async def update_user_profile(self, access_token: str, request: UpdateProfileRequest) -> UserProfile:
        """
        Updates authenticated user profile in Supabase Auth user_metadata and public.profiles table.
        """
        try:
            user_profile = await self.get_current_user(access_token)
            user_id = user_profile.id
            email = user_profile.email

            updates = {}
            if request.full_name is not None:
                updates["full_name"] = request.full_name
            if request.phone is not None:
                updates["phone"] = request.phone
            if request.preferred_language is not None:
                updates["preferred_language"] = request.preferred_language

            if updates:
                try:
                    profile_payload = {"id": user_id, "email": email, **updates}
                    await self._run_with_timeout(
                        lambda: self.client.table("profiles").upsert(profile_payload).execute(),
                        timeout=3.0
                    )
                except Exception as db_err:
                    logger.warning(f"Could not update Supabase 'profiles' table: {db_err}")

                try:
                    await self._run_with_timeout(
                        self.client.auth.update_user,
                        {"data": updates},
                        timeout=4.0
                    )
                except Exception as auth_err:
                    logger.warning(f"Could not update user metadata in Supabase Auth: {auth_err}")

            return await self.get_current_user(access_token)
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Update Profile Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

supabase_auth_service = SupabaseAuthService()

