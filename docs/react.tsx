import React, { useState, useEffect } from "react";
import tbClient, { TelemetryData } from 'thingsboard-js-sdk';

//tb server config
const config = {
  host: "hostname",
  username: "username",
  password: "secret"
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
  keys: ['temperature'],
  limit: 10,
  agg: 'AVG',
  interval: 3600,
  startTs: now - 36000,
  endTs: now,
  entityId: "xxx-xxx-xxx"
};

const TbClientHome: React.FC = () => {
  const [timeseries, setTimeseries] = useState<TelemetryData | null>(null); //device timeseries
  const [connected, setConnected] = useState<boolean | null>(null); //client is connected

  const connect = async (): Promise<void> => {
    const token: string | null = await client.connect(); // connect() returns token or null

    if (token) {
      setConnected(true);
      client.getTimeseries(device, setTimeseries);
    } else {
      alert('Login failed !!!');
      setConnected(false);
    }
  };

  useEffect(() => {
    connect();
  }, []);

  if (connected && timeseries && timeseries.temperature && timeseries.temperature.length > 0) {
    return (
      <div>
        <ul>
          {timeseries.temperature.map((item, key) => (
            <li key={key}>{item.ts}: {item.value}</li>
          ))}
        </ul>
      </div>
    );
  } else {
    return <div>Connecting...</div>;
  }
};

export default TbClientHome;