const url =
  "http://localhost:3000/api/database/1396478591318888509/1396479387037208576/1396480042489352263";

const options = {
  credentials: "include",
  headers: {
    cookie:
      "__next_hmr_refresh_hash__=1356; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI4ODFkNGQ1NC0xMjZkLTQzNjItODIyOC1kZDIyMzVlOTBiNTgiLCJ1c2VybmFtZSI6ImVyenlzaCIsImlzQWRtaW4iOnRydWUsImRhdGFiYXNlcyI6e30sIm1lc3NhZ2VJZCI6IjEzOTM2MTAzOTU4MzQ2NTA3MjYiLCJpYXQiOjE3NTMwMTc5MTIsImV4cCI6MTc1MzAyMTUxMn0.Rg1TLqGjnUFeaFFksT1WTJBz2nXSX4uj-yjR7mgabTw; x-user-id=881d4d54-126d-4362-8228-dd2235e90b58",
  },
};

fetch(url, options)
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((e) => console.error(e));
