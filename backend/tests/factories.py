"""Small sample payloads shared by processing and configuration tests."""

def configuration():
    return {
        'programId': 1,
        'criteria': [{'id': 'experience', 'name': 'Experience', 'type': 'text',
            'priority': 'high', 'guidance': 'Evaluate relevant projects.',
            'options': [], 'ranges': [], 'unit': ''}],
    }
