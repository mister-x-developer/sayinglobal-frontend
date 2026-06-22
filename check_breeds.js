const axios = require('axios');
axios.get('https://sayinglobal.com/api/v1/reference/categories/cattle/breeds/?locale=ru')
  .then(res => console.log(JSON.stringify(res.data, null, 2)))
  .catch(err => console.error(err.message));
