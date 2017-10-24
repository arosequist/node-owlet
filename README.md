# node-owlet
Node wrapper for the [Owlet](http://www.owletcare.com/) API

## Legal

This code is in no way affiliated with, authorized, maintained, sponsored or endorsed by Owlet Baby Care or any of its affiliates or subsidiaries. This is an independent and unofficial API. Use at your own risk.

## Installation

```
$ npm install --save @arosequist/owlet
```

## Usage

```js
import { connect } from '@arosequist/owlet';

async function run() {
    const owlet = await connect('my@email.com', 'my-owlet-password');

    const devices = await owlet.getDevices();
    const deviceId = devices[0].id;

    const {
        babyName,
        isBaseStationOn,
        batteryLevel, // percentage, 0-100
        isCharging,
        isSockOff,
        isSockConnected,
        isWiggling,
        heartRate,
        oxygenLevel
    } = await owlet.getProperties(deviceId);

    await owlet.turnBaseStationOn(deviceId);
    await owlet.turnBaseStationOff(deviceId);
};
```
