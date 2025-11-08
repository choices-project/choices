declare namespace _default {
    namespace service {
        let name: string;
        let version: string;
        let port: string | number;
        let environment: string;
    }
    namespace database {
        let url: string;
        let serviceRoleKey: string;
        let timeout: number;
    }
    namespace apis {
        namespace congressGov {
            export let baseUrl: string;
            export let apiKey: string;
            let timeout_1: number;
            export { timeout_1 as timeout };
        }
        namespace googleCivic {
            let baseUrl_1: string;
            export { baseUrl_1 as baseUrl };
            let apiKey_1: string;
            export { apiKey_1 as apiKey };
            let timeout_2: number;
            export { timeout_2 as timeout };
        }
        namespace fec {
            let baseUrl_2: string;
            export { baseUrl_2 as baseUrl };
            let apiKey_2: string;
            export { apiKey_2 as apiKey };
            let timeout_3: number;
            export { timeout_3 as timeout };
        }
    }
    namespace schedule {
        let ingestion: string;
        let healthCheck: string | number;
    }
    namespace logging {
        let level: string;
        let format: string;
    }
}
export default _default;
//# sourceMappingURL=default.d.ts.map