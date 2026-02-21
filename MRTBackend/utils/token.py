import jwt 

SECRET_KEY = "secret"
ALGORITHM = "HS256"

def create_token(data: dict):
    token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decode_token(token:str):
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return(decoded_token)
    except Exception as error:
        print("token error: ", + error)
        
    return None

