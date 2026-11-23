import json
import re
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"


def load_json(filename: str):
    file_path = DATA_DIR / filename

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def get_diseases():
    return load_json("diseases.json")


def get_vaccinations():
    return load_json("vaccinations.json")


def find_disease(name: str):
    name = name.lower().strip()

    for disease in get_diseases():

        if disease["name"].lower() == name:
            return disease

        for alias in disease.get("aliases", []):
            if alias.lower() == name:
                return disease

    return None


def search_diseases(query: str):
    """
    Search diseases using English names, aliases,
    and multilingual disease names.
    """

    query = query.lower().strip()

    multilingual_terms = get_multilingual_terms()

    matches = []

    for disease in get_diseases():

        disease_name = disease.get("name", "").lower()

        names = [
            disease_name,
            *[
                alias.lower()
                for alias in disease.get("aliases", [])
            ]
        ]

        # Add multilingual names
        names.extend(
            term.lower()
            for term in multilingual_terms.get(disease_name, [])
        )

        for name in names:

            if name and name in query:
                matches.append((len(name), disease))
                break

    matches.sort(
        key=lambda item: item[0],
        reverse=True
    )

    return [
        disease
        for _, disease in matches
    ]

def find_vaccinations(vaccine_name: str):
    vaccine_name = vaccine_name.lower().strip()

    return [
        vaccine
        for vaccine in get_vaccinations()
        if vaccine["vaccine"].lower() == vaccine_name
        or vaccine_name in vaccine["vaccine"].lower()
    ]


def search_vaccinations(query: str):
    """
    Search the complete vaccination dataset using
    exact vaccine names or relevant fields.
    """

    query = query.lower().strip()

    matches = []

    for vaccine in get_vaccinations():

        searchable_fields = [
            vaccine.get("vaccine", ""),
            vaccine.get("age_group", ""),
            vaccine.get("dose", ""),
            vaccine.get("prevents", "")
        ]

        for field in searchable_fields:

            field = field.lower().strip()

            if field and field in query:
                matches.append(vaccine)
                break

    return matches

def get_multilingual_terms():
    return load_json("multilingual_terms.json")