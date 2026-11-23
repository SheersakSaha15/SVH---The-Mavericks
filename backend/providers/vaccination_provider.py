from typing import List, Dict, Any

class VaccinationProvider:
    """
    Vaccination Provider abstraction.
    """
    async def get_schedule(self, target_group: str = "child") -> List[Dict[str, Any]]:
        return [
            {
                "name": "BCG & OPV-0",
                "dose": "At Birth",
                "target_age": "Infant",
                "due_days": 0,
                "description": "Protects against Tuberculosis and Poliomyelitis."
            },
            {
                "name": "Pentavalent-1 & Rotavirus-1",
                "dose": "6 Weeks",
                "target_age": "Infant",
                "due_days": 42,
                "description": "Protects against Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib, and Rotavirus diarrhea."
            },
            {
                "name": "Pentavalent-3 & Rotavirus-3",
                "dose": "14 Weeks",
                "target_age": "Infant",
                "due_days": 98,
                "description": "Third booster dose for comprehensive immunization."
            },
            {
                "name": "MR-1 (Measles & Rubella)",
                "dose": "9 Months",
                "target_age": "Infant",
                "due_days": 270,
                "description": "First dose of Measles-Rubella vaccine."
            }
        ]

vaccination_provider = VaccinationProvider()
