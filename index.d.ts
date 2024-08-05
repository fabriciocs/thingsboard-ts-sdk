declare module 'thingsboard-js-sdk'  {
    export interface Config {
        host: string;
        token?: string;
        publicId?: string;
        username?: string;
        password?: string;
    }

    export interface ConnectResult {
        token: string;
        user: string | null;
    }

    export interface Device {
        id: string;
        name: string;
        type: string;
        label: string;
        additionalInfo: any;
    }

    export interface TelemetryData {
        [key: string]: any;
    }

    export default class tbClient {
        constructor(config: Config);
        connect(isPublic?: boolean): Promise<ConnectResult | null>;
        disconnect(): null;
        getTenantDevices(params?: { pageSize?: number; page?: number; sortProperty?: string; sortOrder?: string; }, callback?: ((devices: Device[] | null) => void) | null): Promise<Device[] | null>;
        getKeys(params: { entityId: string; scope?: 'client' | 'shared' | 'server' | 'timeseries'; }, callback?: ((keys: string[] | null) => void) | null): Promise<string[] | null>;
        getAttributesByScope(params: { entityId: string; scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE'; keys: string[]; }, callback?: ((attributes: TelemetryData | null) => void) | null): Promise<TelemetryData | null>;
        deleteEntityKeys(params: { entityId: string; keys?: string[]; scope?: 'timeseries' | 'client' | 'shared' | 'server'; olderThan?: number; }, callback?: ((response: any) => void) | null): Promise<any | null>;
        getTimeseries(params: { entityId: string; keys?: string[]; limit?: number; agg?: string; interval?: number; startTs?: number; endTs?: number; useStrictDataTypes?: boolean; }, callback?: ((data: TelemetryData | null) => void) | null): Promise<TelemetryData | null>;
        subscribe(params: { entityId: string; cmdId?: number; }, callback: (data: any) => void): void;
    }
}