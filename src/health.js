exports.getHealth = function (req, resp) {
    let endpoint = `/v1/sys/health`;
    let vaultAddr = decodeURI(req.query['vaultaddr']);
    let config = { headers: { 'X-Vault-Token': req.query['token'] } }

    axios.get(`${vaultAddr}${endpoint}`, config)
        .then((resp) => {
            res.json(resp.data.data);
        })
        .catch((err) => {
            console.error(err.stack);
        });
}