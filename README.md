# nodejs-goldylocks-h2

Setup
-----
The H2 database must first be converted to MySQL/MariaDB with a tool like [RazorSQL](https://razorsql.com/download.html).

Next configure the `config.json` file at the root path with the [Goldylocks](https://www.goldylocks.pt/) *alias*, *API* key and the destination mysql server to where you converted the H2 database:
```javascript
  "goldylocks_alias": "",
  "goldylocks_api_key": "",
  "h2_database_host": "localhost",
  "h2_database_username": "root",
  "h2_database_name": "",
  "h2_datapase_password": ""
}
```