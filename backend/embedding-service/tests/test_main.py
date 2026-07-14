from app.main import DIMENSIONS, deterministic_embedding

def test_embedding_is_stable_and_normalized():
    vector = deterministic_embedding("Funny travel stories")
    assert vector == deterministic_embedding("Funny travel stories")
    assert len(vector) == DIMENSIONS
    assert round(sum(value * value for value in vector), 6) == 1.0
