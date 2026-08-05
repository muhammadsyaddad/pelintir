# from fastapi import FastAPI

# app = FastAPI()


# @app.get("/")
# def read_root():
#     return {"Hello": "World"}


# @app.get("/items/{item_id}")
# def read_item(item_id: int, q: str | None = None):
#     return {"item_id": item_id, "q": q}

# from typing import Optional

# from pydantic import BaseModel


# class Foo(BaseModel):
#     count: int
#     size: Optional[float] = None


# class Bar(BaseModel):
#     apple: str = "x"
#     banana: str = "y"


# class Spam(BaseModel):
#     foo: Foo
#     bars: list[Bar]


# m = Spam(foo={"count": 4}, bars=[{"apple": "x1"}, {"apple": "x2"}])
# print(f"ini apaan dh = {m} \n")
# print(m.model_dump())
