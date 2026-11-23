import asyncio
import uuid
import logging
from supabase_service import supabase_auth_service
from models import SignUpRequest, SignInRequest

logging.basicConfig(level=logging.INFO)

async def test_flow():
    unique_id = uuid.uuid4().hex[:6]
    test_email = f"healthbridgetest_{unique_id}@gmail.com"
    test_pass = "TestPassword123!"


    print(f"\n--- 1. Testing Sign Up for: {test_email} ---")
    signup_req = SignUpRequest(
        email=test_email,
        password=test_pass,
        full_name="Test User HealthBridge",
        phone="+919876543210",
        preferred_language="hi"
    )
    
    signup_res = await supabase_auth_service.sign_up(signup_req)
    print("Sign Up Success:", signup_res.success)
    print("Sign Up Message:", signup_res.message)
    print("User ID:", signup_res.user.id if signup_res.user else None)
    print("Full Name:", signup_res.user.full_name if signup_res.user else None)
    print("Language:", signup_res.user.preferred_language if signup_res.user else None)
    
    print(f"\n--- 2. Testing Sign In for: {test_email} ---")
    signin_req = SignInRequest(
        email=test_email,
        password=test_pass
    )
    
    signin_res = await supabase_auth_service.sign_in(signin_req)
    print("Sign In Success:", signin_res.success)
    print("Access Token (JWT) acquired:", signin_res.access_token[:30] + "..." if signin_res.access_token else None)
    
    if signin_res.access_token:
        print("\n--- 3. Testing JWT Token Crosscheck (/api/auth/me) ---")
        user_profile = await supabase_auth_service.get_current_user(signin_res.access_token)
        print("Verified User ID:", user_profile.id)
        print("Verified Email:", user_profile.email)
        print("Verified Name:", user_profile.full_name)
        print("Verified Phone:", user_profile.phone)
        print("Verified Language:", user_profile.preferred_language)

if __name__ == "__main__":
    asyncio.run(test_flow())
