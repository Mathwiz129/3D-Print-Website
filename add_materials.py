#!/usr/bin/env python3
"""
Script to add default materials to Firestore database
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os

def add_default_materials():
    """Add default materials to Firestore"""
    
    # Initialize Firebase (same as in app.py)
    if not firebase_admin._apps:
        try:
            # Try to use environment variable (for Render deployment)
            firebase_creds = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
            if firebase_creds and os.path.exists(firebase_creds):
                cred = credentials.Certificate(firebase_creds)
                firebase_admin.initialize_app(cred)
                print("Firebase initialized with environment credentials")
            else:
                # Fall back to file (for local development)
                local_creds_file = "outprint-3d-printing-firebase-adminsdk-fbsvc-bee53169f9.json"
                if os.path.exists(local_creds_file):
                    cred = credentials.Certificate(local_creds_file)
                    firebase_admin.initialize_app(cred)
                    print("Firebase initialized with local credentials file")
                else:
                    print("No Firebase credentials found!")
                    return
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            return
    
    db = firestore.client()
    
    # Default materials data
    default_materials = [
        {
            "name": "PLA",
            "price": 0.0294,
            "density": 1.24,
            "description": "Polylactic Acid - Biodegradable, easy to print",
            "colors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF", "#000000", "#FFA500", "#800080"],
            "category": "Standard"
        },
        {
            "name": "ABS",
            "price": 0.0347,
            "density": 1.04,
            "description": "Acrylonitrile Butadiene Styrene - Strong, heat resistant",
            "colors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF", "#000000", "#FFA500", "#800080"],
            "category": "Standard"
        },
        {
            "name": "PETG",
            "price": 0.0412,
            "density": 1.27,
            "description": "Polyethylene Terephthalate Glycol - Strong, flexible, food safe",
            "colors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF", "#000000", "#FFA500", "#800080"],
            "category": "Premium"
        },
        {
            "name": "TPU",
            "price": 0.0723,
            "density": 1.21,
            "description": "Thermoplastic Polyurethane - Flexible, rubber-like",
            "colors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF", "#000000"],
            "category": "Specialty"
        },
        {
            "name": "PC",
            "price": 0.0891,
            "density": 1.20,
            "description": "Polycarbonate - Very strong, heat resistant, transparent",
            "colors": ["#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF"],
            "category": "Premium"
        }
    ]
    
    # Add materials to Firestore
    materials_ref = db.collection('materials')
    
    for material in default_materials:
        try:
            # Check if material already exists
            existing = materials_ref.where('name', '==', material['name']).limit(1).stream()
            exists = False
            for doc in existing:
                exists = True
                print(f"Material {material['name']} already exists, skipping...")
                break
            
            if not exists:
                # Add new material
                doc_ref = materials_ref.add(material)
                print(f"Added material: {material['name']} (ID: {doc_ref[1].id})")
            else:
                print(f"Material {material['name']} already exists, skipping...")
                
        except Exception as e:
            print(f"Error adding material {material['name']}: {e}")
    
    print("\nMaterials setup complete!")
    print("You can now use these materials in your 3D printing website.")

if __name__ == "__main__":
    add_default_materials() 