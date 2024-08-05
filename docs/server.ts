 
import tbClient, { Device, TelemetryData } from 'thingsboard-js-sdk';

//tb server config
const config = {
  host: "hostname",
  username: "username",
  password: "password"
};

//init client
const client = new tbClient(config);

const now: number = Date.now();

//device
const device: {
  keys: string[];
  limit: number;
  agg: string;
  interval: number;
  startTs: number;
  endTs: number;
  entityId: string;
} = {
  keys: ['t'],
  limit: 10,
  agg: 'AVG',
  interval: 3600,
  startTs: now - 360000,
  endTs: now,
  entityId: "xxx-xxx-xxx-xxx-xxxx"
};

async function getDevices(): Promise<void> {
  const { token, user } = await client.connect();
  console.log('TOKEN', token);
  console.log('USER', user);

  const params: { pageSize?: number; page?: number; sortProperty?: string; sortOrder?: string; } = {}; //use defaults

  const devices: Device[] | null = await client.getTenantDevices(params);
  if (devices) {
    console.log('DEVICES', devices.length);
  }

  const temperatures: TelemetryData | null = await client.getTimeseries(device);
  if (temperatures) {
    console.log('TEMPS', temperatures);
  }
}

getDevices();