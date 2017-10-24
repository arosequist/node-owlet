import axios from 'axios';
import { AxiosResponse } from 'axios';

interface LoginResponse {
    access_token: string;
    refresh_token: string;
}

interface DeviceResponse {
    device: {
        dsn: string;
        product_name: string;
        model: string;
        connection_status: string;
        device_type: string;
    }
}

interface PropertyResponse {
    property: {
        name: string;
        value: number | string;
    }
}

export const connect = async (email: string, password: string) => {
    const userHttp = axios.create({ baseURL: 'https://user-field.aylanetworks.com' });
    const adsHttp = axios.create({ baseURL: 'https://ads-field.aylanetworks.com/apiv1' });
    const loginResponse = await userHttp.post<LoginResponse>('users/sign_in.json', {
        user: {
            email,
            password,
            application: {
                app_id: 'OWL-id',
                app_secret: 'OWL-4163742'
            }
        }
    });

    let accessToken = loginResponse.data.access_token;
    let refreshToken = loginResponse.data.refresh_token;

    const runWithAuth = async <T> (fn: (auth: string) => Promise<AxiosResponse<T>>, retry = true): Promise<AxiosResponse<T>> => {
        try {
            return fn(`auth_token ${accessToken}`);
        } catch (err) {
            if (retry && err.response && err.response.status === 401) {
                const refreshResponse = await userHttp.post<LoginResponse>('users/refresh_token.json', {
                    user: {
                        refresh_token: refreshToken
                    }
                });
                accessToken = refreshResponse.data.access_token;
                refreshToken = refreshResponse.data.refresh_token;
                return runWithAuth(fn, false);
            } else {
                throw err;
            }
        }
    };

    return {
        async getDevices() {
            const response = await runWithAuth((auth) => {
                return adsHttp.get<DeviceResponse[]>('devices.json', {
                    headers: {
                        Authorization: auth
                    }
                });
            });

            return response.data.map(({ device }) => ({
                id: device.dsn,
                type: device.device_type,
                product: device.product_name,
                model: device.model,
                connectionStatus: device.connection_status
            }));
        },

        async getProperties(deviceId: string) {
            const response = await runWithAuth((auth) => {
                return adsHttp.get<PropertyResponse[]>(`dsns/${deviceId}/properties.json`, {
                    headers: {
                        Authorization: auth
                    }
                });
            });

            const responseAsMap: {[prop: string]: number | string} = {};
            for (const { property } of response.data) {
                console.log(property);
                responseAsMap[property.name] = property.value;
            }

            const asBoolean = (value: number | string) => value === 1;

            return {
                babyName: <string> responseAsMap['BABY_NAME'],
                isBaseStationOn: asBoolean(responseAsMap['BASE_STATION_ON']),
                batteryLevel: <number> responseAsMap['BATT_LEVEL'],
                isCharging: asBoolean(responseAsMap['CHARGE_STATUS']),
                isSockOff: asBoolean(responseAsMap['SOCK_OFF']),
                isSockConnected: asBoolean(responseAsMap['SOCK_CONNECTION']),
                isWiggling: asBoolean(responseAsMap['MOVEMENT']),
                heartRate: <number> responseAsMap['HEART_RATE'],
                oxygenLevel: <number> responseAsMap['OXYGEN_LEVEL']
            };
        },

        async turnBaseStationOn(deviceId: string) {
            await runWithAuth((auth) => {
                return adsHttp.post('properties/14852273/datapoints.json', {
                    datapoint: {
                        value: 1
                    }
                }, {
                    headers: {
                        Authorization: auth
                    }
                });
            });
        },

        async turnBaseStationOff(deviceId: string) {
            await runWithAuth((auth) => {
                return adsHttp.post('properties/14852273/datapoints.json', {
                    datapoint: {
                        value: 0
                    }
                }, {
                    headers: {
                        Authorization: auth
                    }
                });
            });
        }
    };
};
