from typing import List, Dict, Any

class OutbreakAlertProvider:
    """
    Outbreak Alert Provider abstraction.
    """
    async def get_active_alerts(self, region: str = "Khordha") -> List[Dict[str, Any]]:
        return [
            {
                "id": "alert-101",
                "disease": "Dengue",
                "region": "Khordha District",
                "severity": "high",
                "message": "Elevated dengue vector activity reported. Community fogging active.",
                "source": "Government IDSP Cell",
                "updated_at": "2026-08-30T14:30:00Z"
            },
            {
                "id": "alert-102",
                "disease": "Cholera",
                "region": "Ganjam District",
                "severity": "medium",
                "message": "Waterborne diarrheal disease advisory. Drink boiled water.",
                "source": "State Health Mission",
                "updated_at": "2026-08-30T11:15:00Z"
            },
            {
                "id": "alert-103",
                "disease": "Malaria",
                "region": "Mayurbhanj District",
                "severity": "low",
                "message": "Mosquito net distribution camp active across rural blocks.",
                "source": "NCVBDC Field Unit",
                "updated_at": "2026-08-29T18:00:00Z"
            }
        ]

outbreak_provider = OutbreakAlertProvider()
