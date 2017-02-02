import axios from 'axios';
import _ from 'lodash';

function resetCapabilityCache() {
    window.localStorage.setItem('capability_cache', JSON.stringify({}));
    return {};
}

function setCachedCapabilities(path, result) {
    var cache = JSON.parse(window.localStorage.getItem('capability_cache'));
    if (!cache) {
        cache = resetCapabilityCache();
    }
    cache[path] = result;
    window.localStorage.setItem('capability_cache', JSON.stringify(cache));
}

function getCachedCapabilities(path) {
    var cache = JSON.parse(window.localStorage.getItem('capability_cache'));
    if (!cache) {
        cache = resetCapabilityCache();
    }
    if (path in cache) {
        return cache[path];
    } else {
        throw new Error('cache miss');
    }
}

function callVaultApi(method, path, query = {}, data, headers = {}) {

    var instance = axios.create({
        baseURL: '/v1/',
        params: { "vaultaddr": window.localStorage.getItem("vaultUrl") },
        headers: { "X-Vault-Token": window.localStorage.getItem("vaultAccessToken") }
    });

    return instance.request({
        url: encodeURI(path),
        method: method,
        data: data,
        params: query,
        headers: headers
    });
}

function tokenHasCapabilities(capabilities, path) {

    if (window.localStorage.getItem('enableCapabilitiesCache')) {
        try {
            var cached_capabilities = getCachedCapabilities(path);
            // At this point we have a result from the cache we can return the value in a form of a resolved promise
            if (cached_capabilities) {
                var evaluation = _.every(capabilities, function (v) {
                    return _.indexOf(cached_capabilities, v) !== -1;
                });
                if (evaluation || _.indexOf(cached_capabilities, 'root') !== -1) {
                    return Promise.resolve(true);
                }
            }
            return Promise.reject(false);
        } catch (e) {
            // That was a cache miss, let's continue and ask vault
        }
    }

    return callVaultApi('post', 'sys/capabilities-self', {}, { path: path })
        .then((resp) => {
            setCachedCapabilities(path, resp.data.capabilities);
            var evaluation = _.every(capabilities, function (v) {
                let has_cap = _.indexOf(resp.data.capabilities, v) !== -1;
                return has_cap;
            });

            if (evaluation || _.indexOf(resp.data.capabilities, 'root') !== -1) {
                return Promise.resolve(true);
            }
            return Promise.reject(false)
        })
        .catch((err) => {
            return Promise.reject(err)
        });
}

module.exports = {
    callVaultApi: callVaultApi,
    tokenHasCapabilities: tokenHasCapabilities,
    resetCapabilityCache: resetCapabilityCache
};