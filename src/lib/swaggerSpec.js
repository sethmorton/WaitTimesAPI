import { CALIPORTS, CALINAMES } from "./constants.js";


export const spec = {
  openapi: "3.0.0",
  info: {
    title: "Wait Times API",
    version: "1.0.0",
    description:
      "API for retrieving wait times data for California border crossings",
  },
  servers: [
    {
      url: "https://us-west1-ssp-all-sites.cloudfunctions.net/waitTimesData",
      description: "Production server",
    },
  ],
  paths: {
    "/": {
      get: {
        summary: "Retrieve wait times data",
        parameters: [
          {
            name: "startDate",
            in: "query",
            schema: { type: "string" },
            description:
              "Start date for filtering (YYYY-MM-DD). Earliest available date is 2022-01-28.",
          },
          {
            name: "endDate",
            in: "query",
            schema: { type: "string" },
            description: "End date for filtering (YYYY-MM-DD)",
          },
          {
            name: "laneType",
            in: "query",
            schema: {
              type: "integer",
              enum: [0, 1, 2, 3],
            },
            description:
              "Lane type filter: 0 = Passengers, 1 = Vehicles, 2 = Pedestrians, 3 = Trucks",
          },
          {
            name: "portNum",
            in: "query",
            schema: {
              type: "integer",
              enum: CALIPORTS,
            },
            description: `Port number filter. Available ports: ${CALINAMES.join(", ")}`,
          },
          {
            name: "rowCount",
            in: "query",
            schema: { type: "integer" },
            description: "Number of rows to return (default: 100)",
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          date: { type: "string", format: "date-time" },
                          lane_type: {
                            type: "integer",
                            description:
                              "0 = Passengers, 1 = Vehicles, 2 = Pedestrians, 3 = Trucks",
                          },
                          port_num: {
                            type: "integer",
                            description: `One of the following: ${CALIPORTS.join(", ")}`,
                          },
                          wait_time: {
                            type: "integer",
                            description: "Wait time in minutes",
                          },
                        },
                      },
                    },
                    totalCount: { type: "integer" },
                    requestedRowCount: { type: "integer" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    details: { type: "object" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    details: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};