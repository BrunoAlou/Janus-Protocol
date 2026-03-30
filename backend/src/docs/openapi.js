function createOpenApiSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Janus Protocol API',
      version: '1.0.0',
      description: 'API de telemetria, autenticação e utilitários de runtime do Janus-Protocol.'
    },
    servers: [{ url: '/', description: 'Current server' }],
    tags: [
      { name: 'Health' },
      { name: 'Events' },
      { name: 'Auth' },
      { name: 'Telemetry' },
      { name: 'Debug' }
    ],
    components: {
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            backend: { type: 'string', example: 'janus-protocol' },
            port: { type: 'number', example: 3000 },
            docs: { type: 'string', example: '/api/docs' }
          },
          required: ['status', 'backend', 'port', 'docs']
        },
        EventPayload: {
          type: 'object',
          additionalProperties: true,
          example: {
            scene: 'reception',
            action: 'talk_to_receptionist'
          }
        },
        EventInput: {
          type: 'object',
          additionalProperties: true,
          properties: {
            _id: { type: 'string', example: '66f72e3f0f1f8e6f9a32a6c1' },
            session_id: { type: 'string', example: 'session-123' },
            seq_in_session: { type: 'number', example: 1 },
            type_event: {
              type: 'string',
              enum: [
                'collision',
                'movement',
                'interaction',
                'session_start',
                'session_end',
                'position_sample',
                'player_step',
                'player_action'
              ],
              example: 'interaction'
            },
            payload: { $ref: '#/components/schemas/EventPayload' },
            prev_hash: { type: 'string', example: 'ed8f4ffb5c6e3ca9f5d8fa19e6ef8dd0471bbce2ce0f6d6f7cf4972b748575db' },
            insertedAt: { type: 'string', format: 'date-time' },
            user_anon_id: { type: 'string', example: 'anon-player-1' },
            hash: { type: 'string', example: '3ea26f5d1b8f1c8f61e422be0f4a4f4eb7d322420f7ad53803fc5f2fc8ea04bd' }
          }
        },
        EventIngestResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            insertedId: { type: 'string', example: '66f72e3f0f1f8e6f9a32a6c1' },
            hash: { type: 'string', example: '3ea26f5d1b8f1c8f61e422be0f4a4f4eb7d322420f7ad53803fc5f2fc8ea04bd' },
            last_hash: { type: 'string', nullable: true }
          },
          required: ['ok', 'insertedId', 'hash']
        },
        BatchIngestResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            inserted: { type: 'number', example: 2 }
          },
          required: ['ok', 'inserted']
        },
        BatchPartialFailureResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: false },
            failures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', nullable: true },
                  error: { type: 'string', example: 'hash_mismatch' },
                  expected: { type: 'string' },
                  last_hash: { type: 'string' }
                },
                required: ['error']
              }
            }
          },
          required: ['ok', 'failures']
        },
        LastHashResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            last_hash: { type: 'string', nullable: true }
          },
          required: ['ok', 'last_hash']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: false },
            error: { type: 'string', example: 'invalid_payload' },
            details: { type: 'object', additionalProperties: true }
          },
          required: ['ok', 'error']
        },
        AuthTokenRequest: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'AQRF...OAuthCode' },
            provider: { type: 'string', enum: ['linkedin', 'google'], example: 'linkedin' }
          },
          required: ['code']
        },
        AuthUser: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            picture: { type: 'string' },
            provider: { type: 'string', enum: ['linkedin', 'google'] }
          },
          required: ['id', 'name', 'provider']
        },
        AuthTokenResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            access_token: { type: 'string' },
            user: { $ref: '#/components/schemas/AuthUser' }
          },
          required: ['success', 'access_token', 'user']
        },
        TelemetryInput: {
          type: 'object',
          additionalProperties: true,
          example: {
            minigame: 'it-room-quiz',
            summary: {
              minigame: 'it-room-quiz',
              score: 82
            }
          }
        },
        TelemetryIngestResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true }
          },
          required: ['ok']
        },
        PublicAveragesResponse: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              averageScore: { type: 'number', example: 78.5 },
              standardDeviation: { type: 'number', example: 9.7 },
              totalPlayers: { type: 'number', example: 12 }
            },
            required: ['averageScore', 'standardDeviation', 'totalPlayers']
          }
        },
        DebugUnlockRequest: {
          type: 'object',
          properties: {
            password: { type: 'string', example: 'manager-secret' }
          },
          required: ['password']
        },
        DebugUnlockResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            unlocked: { type: 'boolean', example: true }
          },
          required: ['ok', 'unlocked']
        }
      }
    },
    paths: {
      '/': {
        get: {
          tags: ['Health'],
          summary: 'Status da API',
          responses: {
            '200': {
              description: 'API online',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' }
                }
              }
            }
          }
        }
      },
      '/api/events': {
        get: {
          tags: ['Events'],
          summary: 'Lista eventos',
          responses: {
            '200': {
              description: 'Lista de eventos persistidos',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/EventInput' }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Events'],
          summary: 'Ingere um evento',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EventInput' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Evento aceito',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/EventIngestResponse' }
                }
              }
            },
            '400': {
              description: 'Payload inválido',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            },
            '409': {
              description: 'Hash chain inválida',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/api/events/batch': {
        post: {
          tags: ['Events'],
          summary: 'Ingere lote de eventos',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/EventInput' }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Lote aceito sem falhas',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BatchIngestResponse' }
                }
              }
            },
            '207': {
              description: 'Falhas parciais no lote',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BatchPartialFailureResponse' }
                }
              }
            },
            '400': {
              description: 'Payload inválido',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/api/last_hash': {
        get: {
          tags: ['Events'],
          summary: 'Obtém último hash por sessão',
          parameters: [
            {
              in: 'query',
              name: 'session_id',
              required: false,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Hash encontrado (ou null)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LastHashResponse' }
                }
              }
            }
          }
        }
      },
      '/api/auth/token': {
        post: {
          tags: ['Auth'],
          summary: 'Troca código OAuth por token (LinkedIn/Google)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthTokenRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Token e dados do usuário',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthTokenResponse' }
                }
              }
            },
            '400': {
              description: 'Payload inválido ou provider não suportado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            },
            '500': {
              description: 'Credenciais OAuth ausentes/erro interno',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/auth/callback': {
        get: {
          tags: ['Auth'],
          summary: 'Callback OAuth',
          responses: {
            '302': { description: 'Redireciona para frontend com sessão' },
            '400': {
              description: 'Callback inválido',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/api/telemetry/minigame': {
        post: {
          tags: ['Telemetry'],
          summary: 'Ingestão de telemetria de minigame',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TelemetryInput' }
              }
            }
          },
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TelemetryIngestResponse' }
                }
              }
            },
            '400': {
              description: 'Payload inválido',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          },
        }
      },
      '/api/minigames/public-averages': {
        get: {
          tags: ['Telemetry'],
          summary: 'Médias públicas por minigame',
          responses: {
            '200': {
              description: 'Métricas agregadas',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PublicAveragesResponse' }
                }
              }
            }
          }
        }
      },
      '/api/debug/unlock': {
        post: {
          tags: ['Debug'],
          summary: 'Valida senha de debug',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DebugUnlockRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Desbloqueado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DebugUnlockResponse' }
                }
              }
            },
            '400': {
              description: 'Payload inválido',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            },
            '401': {
              description: 'Senha inválida',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            },
            '503': {
              description: 'Senha não configurada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      }
    }
  };
}

module.exports = {
  createOpenApiSpec
};
