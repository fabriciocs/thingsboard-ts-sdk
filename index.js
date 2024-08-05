const jwt = require('jwt-decode').default;

export const api = (host, token = null) => {
    return {
        post: async (url, data) => {
            try {
                const response = await fetch(`https://${host}${url}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error(error);
                return null;
            }
        },
        get: async (url) => {
            try {
                const response = await fetch(`https://${host}${url}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Authorization': `Bearer ${token}`
                    }
                });
                return await response.json();
            } catch (error) {
                console.error(error);
                return null;
            }
        }
    };
};

export class tbClient {
    constructor(config) {
        this.config = config;
        this.token = config.token || null;
        this.api = api(config.host, this.token);
    }

    async connect(isPublic = false) {
        let result;
        if (isPublic) {
            result = await this.api.post('/api/auth/login/public', { publicId: this.config.publicId });
        } else {
            result = await this.api.post('/api/auth/login', { username: this.config.username, password: this.config.password });
            result.user = JSON.stringify(jwt(result.token));
        }
        if (result) {
            this.token = result.token;
            this.api = api(this.config.host, this.token);
            return result;
        } else {
            return null;
        }
    }

    disconnect() {
        this.token = null;
        return null;
    }

    async getTenantDevices(params = {}, callback = null) {
        const pageSize = params.pageSize || 100;
        const page = params.page || 0;
        const sortProperty = params.sortProperty || 'name';
        const sortOrder = params.sortOrder || 'ASC';
        return this.api.get(`/api/tenant/devices?pageSize=${pageSize}&page=${page}&sortProperty=${sortProperty}&sortOrder=${sortOrder}`);
    }

    async getKeys(params, callback = null) {
        const entityId = params.entityId;
        if (!entityId) {
            console.error('entityId is undefined');
            return null;
        }
        let scope = params.scope || 'timeseries';
        switch (scope) {
            case 'client':
                scope = 'attributes/CLIENT_SCOPE';
                break;
            case 'shared':
                scope = 'attributes/SHARED_SCOPE';
                break;
            case 'server':
                scope = 'attributes/SERVER_SCOPE';
                break;
            case 'timeseries':
                scope = 'timeseries';
                break;
            default:
                scope = 'timeseries';
                break;
        }
        return this.api.get(`/api/plugins/telemetry/DEVICE/${entityId}/keys/${scope}`);
    }

    async getAttributesByScope(params, callback = null) {
        const entityId = params.entityId;
        if (!entityId) {
            console.log('undefined entityId');
            return null;
        }
        const scope = params.scope || 'CLIENT_SCOPE';
        return this.api.get(`/api/plugins/telemetry/DEVICE/${entityId}/values/attributes/${scope}?keys=${params.keys.join(',')}`);
    }

    async deleteEntityKeys(params, callback = null) {
        const entityId = params.entityId;
        const keys = params.keys || [];
        const scope = params.scope || '';
        const olderThan = Number(params.olderThan || 0);
        let url;
        switch (scope) {
            case 'timeseries':
                if (olderThan === 0) {
                    url = `/api/plugins/telemetry/DEVICE/${entityId}/timeseries/delete?keys=${keys.join(',')}&deleteAllDataForKeys=true`;
                } else {
                    const startTs = 0;
                    const endTs = Date.now() - (olderThan * 1000);
                    url = `/api/plugins/telemetry/DEVICE/${entityId}/timeseries/delete?keys=${keys.join(',')}&startTs=${startTs}&endTs=${endTs}&deleteAllDataForKeys=false`;
                }
                break;
            case 'client':
                url = `/api/plugins/telemetry/DEVICE/${entityId}/CLIENT_SCOPE?keys=${keys.join(',')}`;
                break;
            case 'shared':
                url = `/api/plugins/telemetry/DEVICE/${entityId}/SHARED_SCOPE?keys=${keys.join(',')}`;
                break;
            case 'server':
                url = `/api/plugins/telemetry/DEVICE/${entityId}/SERVER_SCOPE?keys=${keys.join(',')}`;
                break;
            default:
                console.error('Unrecognized scope');
                return null;
        }
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Authorization': `Bearer ${this.token}`
                }
            });
            return response;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async getTimeseries(params, callback = null) {
        const now = Date.now();
        const entityId = params.entityId;
        const keys = params.keys || [];
        const limit = params.limit || 500;
        const agg = params.agg || 'AVG';
        const interval = params.interval || 60000;
        const startTs = params.startTs || now - 3600000;
        const endTs = params.endTs || now;
        const useStrictDataTypes = params.useStrictDataTypes || true;
        const getParams = {
            keys: keys.join(','),
            limit: limit,
            agg: agg,
            interval: interval,
            startTs: startTs,
            endTs: endTs,
            useStrictDataTypes: useStrictDataTypes
        };
        return this.api.get(`/api/plugins/telemetry/DEVICE/${entityId}/values/timeseries`, { params: getParams });
    }

    subscribe(params, callback) {
        const entityId = params.entityId;
        const cmdId = params.cmdId || 10;
        const wssUrl = `wss://${this.config.host}/api/ws/plugins/telemetry?token=${this.token}`;
        const webSocket = new WebSocket(wssUrl);
        webSocket.onopen = function () {
            const object = {
                tsSubCmds: [
                    {
                        entityType: "DEVICE",
                        entityId: entityId,
                        scope: "LATEST_TELEMETRY",
                        cmdId: cmdId
                    }
                ],
                historyCmds: [],
                attrSubCmds: []
            };
            const data = JSON.stringify(object);
            webSocket.send(data);
        };
        webSocket.onmessage = function (event) {
            const received_msg = event.data;
            callback(JSON.parse(received_msg));
        };
        webSocket.onclose = function () {
            console.log('WEBSOCKET CLOSED');
            webSocket.close();
            callback(null);
        };
    }
}

module = tbClient;