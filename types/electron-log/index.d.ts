/** Declaration file generated by dts-gen */

export const appName: string|undefined;

export function debug(msg: any): any;

export function error(msg: any): any;

export function findLogPath(appName: string|null, ...args: any[]): any;

export function format(msg: any): any;

export function info(msg: any): any;

export function log(level: string, text: any, ...args: any[]): any;

export function silly(msg: any): any;

export function verbose(msg: any): any;

export function warn(msg: any): any;

export namespace transports {
    namespace console {
        let level: string;

        function format(msg: any): any;

    }

    namespace file {
        let file: string;
        let level: string;

        let maxSize: number;

        let streamConfig: any;

        function format(msg: any): any;

    }

}

