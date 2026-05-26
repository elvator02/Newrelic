/* =========================================================
   IMPORTS
========================================================= */

import { useRef, useState } from 'react';

import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  MenuItem,
  Select,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

import { getNewRelicData } from '@/RunningWorkflows/apiService';

/* =========================================================
   HELPERS
========================================================= */

const paymentFlowTypes = [
  { value: 'PIPE', label: 'PIPE' },
  { value: 'WRAPPER', label: 'WRAPPER' },
  { value: 'XCONVERT', label: 'XCONVERT' },
  { value: 'GermanyReturn', label: 'GermanyReturn' },
  { value: 'SEPA', label: 'SEPA' },
  { value: 'COMMON', label: 'COMMON' },
];

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms} ms`;

  if (ms < 60000)
    return `${(ms / 1000).toFixed(2)} s`;

  return `${(ms / 60000).toFixed(2)} min`;
}

const hasErrorLog = (logs: any[] = []) =>
  logs.some(
    (log: any) => log.severity === 'ERROR'
  );

const hasWarningLog = (logs: any[] = []) =>
  logs.some(
    (log: any) => log.severity === 'WARNING'
  );

/* =========================================================
   STAGE PILL
========================================================= */

const StagePill = ({
  stage,
  onClick,
  error,
  warning,
  selected,
}: {
  stage: any;
  onClick: () => void;
  error?: boolean;
  warning?: boolean;
  selected?: boolean;
}) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: { xs: 190, sm: 230, md: 260 },
        minWidth: {
          xs: 190,
          sm: 230,
          md: 260,
        },

        height: {
          xs: 74,
          sm: 92,
          md: 100,
        },

        borderRadius: '24px',

        px: 2.5,

        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',

        cursor: 'pointer',

        transition: 'all 0.2s ease',

        background: error
          ? 'linear-gradient(135deg,#ffebee 0%,#ffcdd2 100%)'
          : warning
          ? 'linear-gradient(135deg,#fff8e1 0%,#ffe082 100%)'
          : selected
          ? 'linear-gradient(135deg,#dbeafe 0%,#90caf9 100%)'
          : 'white',

        border: error
          ? '2px solid #ef5350'
          : warning
          ? '2px solid #ffca28'
          : selected
          ? '2px solid #1976d2'
          : '1px solid #dbe3ef',

        boxShadow: selected
          ? '0 8px 24px rgba(25,118,210,0.20)'
          : '0 2px 8px rgba(0,0,0,0.06)',

        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow:
            '0 12px 28px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,

          fontSize: {
            xs: 13,
            sm: 15,
          },

          color: error
            ? '#d32f2f'
            : warning
            ? '#f57f17'
            : '#1565c0',

          whiteSpace: 'nowrap',

          overflow: 'hidden',

          textOverflow: 'ellipsis',

          width: '100%',

          textAlign: 'center',
        }}
      >
        {stage.Stage ||
          stage.processing_stage}
      </Typography>

      <Typography
        sx={{
          fontSize: {
            xs: 12,
            sm: 14,
          },

          fontWeight: 500,

          color: '#334155',

          whiteSpace: 'nowrap',

          overflow: 'hidden',

          textOverflow: 'ellipsis',

          width: '100%',

          textAlign: 'center',
        }}
      >
        {stage.Substage ||
          stage.processing_substage}
      </Typography>

      <Typography
        sx={{
          fontSize: 11,

          color: '#64748b',

          whiteSpace: 'nowrap',

          overflow: 'hidden',

          textOverflow: 'ellipsis',

          width: '100%',

          textAlign: 'center',
        }}
      >
        {stage.app}
      </Typography>
    </Box>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const NewRelicTab = () => {
  const theme = useTheme();

  const isXs = useMediaQuery(
    theme.breakpoints.down('sm')
  );

  /* =======================================================
     REFS
  ======================================================= */

  const stage1Refs = useRef<
    Record<string, HTMLDivElement | null>
  >({});

  const stage2ContainerRef =
    useRef<HTMLDivElement | null>(null);

  /* =======================================================
     STATE
  ======================================================= */

  const [transactionId, setTransactionId] =
    useState('');

  const [
    paymentFlowType,
    setPaymentFlowType,
  ] = useState(paymentFlowTypes[0].value);

  const [fullData, setFullData] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const [
    selectedStage1,
    setSelectedStage1,
  ] = useState<any | null>(null);

  const [
    selectedStage2,
    setSelectedStage2,
  ] = useState<any | null>(null);

  const [activeTab, setActiveTab] =
    useState(0);

  const [logSearch, setLogSearch] =
    useState('');

  /* =======================================================
     FETCH
  ======================================================= */

  const fetchData = async () => {
    setLoading(true);

    setError(null);

    setSelectedStage1(null);

    setSelectedStage2(null);

    setFullData(null);

    try {
      const result = await getNewRelicData(
        transactionId,
        paymentFlowType
      );

      setFullData(result);
    } catch (err: any) {
      setError(
        err.message || 'Failed to fetch'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     DATA
  ======================================================= */

  const stage1Results =
    fullData?.firstStage?.results || [];

  const timeDiffs =
    stage1Results.length > 1
      ? stage1Results
          .slice(1)
          .map((stage: any, idx: number) => {
            return (
              Number(stage.timestamp) -
              Number(
                stage1Results[idx].timestamp
              )
            );
          })
      : [];

  const totalDuration =
    stage1Results.length > 1
      ? Number(
          stage1Results[
            stage1Results.length - 1
          ].timestamp
        ) -
        Number(stage1Results[0].timestamp)
      : 0;

  /* =======================================================
     ERROR HELPERS
  ======================================================= */

  const hasErrorInStage1 = (
    stage1uuid: string
  ) => {
    const apps =
      fullData?.secondStage?.result?.[
        stage1uuid
      ] || [];

    return apps.some((app: any) =>
      hasErrorLog(
        fullData?.thirdStage?.result?.[
          app.appuuid
        ]
      )
    );
  };

  const hasWarningInStage1 = (
    stage1uuid: string
  ) => {
    const apps =
      fullData?.secondStage?.result?.[
        stage1uuid
      ] || [];

    return apps.some((app: any) =>
      hasWarningLog(
        fullData?.thirdStage?.result?.[
          app.appuuid
        ]
      )
    );
  };

  const hasErrorInApp = (
    appuuid: string
  ) =>
    hasErrorLog(
      fullData?.thirdStage?.result?.[
        appuuid
      ]
    );

  const hasWarningInApp = (
    appuuid: string
  ) =>
    hasWarningLog(
      fullData?.thirdStage?.result?.[
        appuuid
      ]
    );

  /* =======================================================
     LOGS
  ======================================================= */

  const selectedAppLogs =
    (selectedStage2 &&
      fullData?.thirdStage?.result?.[
        selectedStage2.appuuid
      ]) ||
    [];

  const filteredLogs = logSearch
    ? selectedAppLogs.filter((log: any) =>
        Object.values(log).some((v) =>
          String(v)
            .toLowerCase()
            .includes(
              logSearch.toLowerCase()
            )
        )
      )
    : selectedAppLogs;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Box
      sx={{
        minHeight: '100vh',

        background: '#f4f7fb',

        pb: selectedStage2 ? '52vh' : 5,
      }}
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <Paper
        elevation={0}
        sx={{
          width: {
            xs: '96%',
            md: '92%',
            lg: 1200,
          },

          mx: 'auto',

          mt: 3,

          p: {
            xs: 2,
            md: 3,
          },

          borderRadius: '24px',

          border: '1px solid #e2e8f0',

          background:
            'linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)',
        }}
      >
        <Typography
          sx={{
            fontSize: {
              xs: 22,
              md: 30,
            },

            fontWeight: 800,

            color: '#0f172a',

            mb: 3,
          }}
        >
          Transaction Tracing
        </Typography>

        <Box
          sx={{
            display: 'flex',

            gap: 2,

            flexDirection: isXs
              ? 'column'
              : 'row',
          }}
        >
          <TextField
            fullWidth
            placeholder="Enter Transaction ID"
            value={transactionId}
            onChange={(e) =>
              setTransactionId(
                e.target.value
              )
            }
          />

          <Select
            value={paymentFlowType}
            onChange={(e) =>
              setPaymentFlowType(
                e.target.value as string
              )
            }
            sx={{
              minWidth: 170,
            }}
          >
            {paymentFlowTypes.map((item) => (
              <MenuItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </MenuItem>
            ))}
          </Select>

          <Button
            variant="contained"
            onClick={fetchData}
            disabled={
              loading || !transactionId
            }
            sx={{
              minWidth: 160,

              borderRadius: '14px',

              fontWeight: 700,

              textTransform: 'none',
            }}
          >
            {loading
              ? 'Fetching...'
              : 'Fetch Data'}
          </Button>
        </Box>

        {totalDuration > 0 && (
          <Box
            sx={{
              mt: 3,

              display: 'inline-flex',

              alignItems: 'center',

              px: 2,

              py: 1,

              borderRadius: '999px',

              background: '#e8f5e9',
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,

                color: '#2e7d32',
              }}
            >
              Total Duration:{' '}
              {formatDuration(totalDuration)}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <Typography
          color="error"
          sx={{
            mt: 3,

            textAlign: 'center',
          }}
        >
          {error}
        </Typography>
      )}

      {/* ===================================================
          STAGE 1 FLOW
      =================================================== */}

      {stage1Results.length > 0 && (
        <Box
          sx={{
            width: {
              xs: '96%',
              md: '92%',
              lg: 1200,
            },

            mx: 'auto',

            mt: 5,

            overflowX: 'auto',

            pb: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',

              alignItems: 'center',

              minWidth: 'max-content',
            }}
          >
            {stage1Results.map(
              (
                stage: any,
                idx: number
              ) => (
                <Box
                  key={stage.uuid}
                  ref={(el) => {
                    stage1Refs.current[
                      stage.uuid
                    ] = el;
                  }}
                  sx={{
                    display: 'flex',

                    alignItems: 'center',
                  }}
                >
                  <StagePill
                    stage={stage}
                    error={hasErrorInStage1(
                      stage.uuid
                    )}
                    warning={hasWarningInStage1(
                      stage.uuid
                    )}
                    selected={
                      selectedStage1?.uuid ===
                      stage.uuid
                    }
                    onClick={() => {
                      setSelectedStage1(
                        stage
                      );

                      setSelectedStage2(
                        null
                      );

                      setActiveTab(0);

                      setTimeout(() => {
                        const node =
                          stage1Refs
                            .current[
                            stage.uuid
                          ];

                        const container =
                          stage2ContainerRef.current;

                        if (
                          node &&
                          container
                        ) {
                          const nodeLeft =
                            node.offsetLeft;

                          container.scrollTo({
                            left:
                              nodeLeft -
                              200,

                            behavior:
                              'smooth',
                          });
                        }
                      }, 100);
                    }}
                  />

                  {idx <
                    stage1Results.length -
                      1 && (
                    <Box
                      sx={{
                        mx: 2,

                        display: 'flex',

                        flexDirection:
                          'column',

                        alignItems:
                          'center',
                      }}
                    >
                      <ArrowForwardIcon
                        sx={{
                          color:
                            '#1976d2',

                          fontSize: 34,
                        }}
                      />

                      <Typography
                        sx={{
                          fontSize: 12,

                          fontWeight: 700,

                          color:
                            '#64748b',
                        }}
                      >
                        {formatDuration(
                          timeDiffs[idx]
                        )}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )
            )}
          </Box>
        </Box>
      )}

      {/* ===================================================
          STAGE 2
      =================================================== */}

      {selectedStage1 && (
        <Box
          sx={{
            width: {
              xs: '96%',
              md: '92%',
              lg: 1200,
            },

            mx: 'auto',

            mt: 5,
          }}
        >
          {/* CONNECTOR */}

          <Box
            sx={{
              width: 2,

              height: 40,

              background:
                'linear-gradient(to bottom,#60a5fa,transparent)',

              mx: 'auto',

              mb: 2,
            }}
          />

          <Typography
            sx={{
              fontSize: 18,

              fontWeight: 700,

              mb: 2,

              color: '#0f172a',
            }}
          >
            Internal Service Calls
          </Typography>

          <Box
            ref={stage2ContainerRef}
            sx={{
              display: 'flex',

              gap: 2,

              overflowX: 'auto',

              pb: 2,

              scrollBehavior: 'smooth',
            }}
          >
            {(
              fullData?.secondStage
                ?.result?.[
                selectedStage1.uuid
              ] || []
            ).map((appObj: any) => (
              <Paper
                key={appObj.appuuid}
                onClick={() => {
                  setSelectedStage2(
                    appObj
                  );

                  setLogSearch('');
                }}
                elevation={0}
                sx={{
                  minWidth: 300,

                  p: 2.5,

                  borderRadius: '20px',

                  cursor: 'pointer',

                  transition:
                    'all 0.2s ease',

                  background:
                    hasErrorInApp(
                      appObj.appuuid
                    )
                      ? '#fff5f5'
                      : hasWarningInApp(
                          appObj.appuuid
                        )
                      ? '#fffbea'
                      : selectedStage2?.appuuid ===
                        appObj.appuuid
                      ? '#eef6ff'
                      : '#ffffff',

                  border:
                    selectedStage2?.appuuid ===
                    appObj.appuuid
                      ? '2px solid #1976d2'
                      : '1px solid #dbe3ef',

                  '&:hover': {
                    transform:
                      'translateY(-4px)',

                    boxShadow:
                      '0 12px 24px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',

                    justifyContent:
                      'space-between',

                    alignItems:
                      'center',

                    mb: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,

                      fontSize: 15,
                    }}
                  >
                    {appObj.app}
                  </Typography>

                  <Chip
                    size="small"
                    label={
                      hasErrorInApp(
                        appObj.appuuid
                      )
                        ? 'ERROR'
                        : hasWarningInApp(
                            appObj.appuuid
                          )
                        ? 'WARNING'
                        : 'OK'
                    }
                    sx={{
                      fontWeight: 700,

                      background:
                        hasErrorInApp(
                          appObj.appuuid
                        )
                          ? '#ffcdd2'
                          : hasWarningInApp(
                              appObj.appuuid
                            )
                          ? '#ffe082'
                          : '#c8e6c9',
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: 12,

                    color: '#64748b',

                    wordBreak:
                      'break-all',
                  }}
                >
                  {appObj.appuuid}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* ===================================================
          BOTTOM PANEL
      =================================================== */}

      {selectedStage2 && (
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',

            bottom: 0,

            left: 0,

            right: 0,

            height: {
              xs: '58vh',
              md: '50vh',
            },

            borderRadius:
              '24px 24px 0 0',

            borderTop:
              '1px solid #dbe3ef',

            background: '#ffffff',

            overflow: 'hidden',

            display: 'flex',

            flexDirection: 'column',

            zIndex: 2000,

            boxShadow:
              '0 -12px 32px rgba(15,23,42,0.12)',
          }}
        >
          {/* HEADER */}

          <Box
            sx={{
              px: 3,

              py: 2,

              borderBottom:
                '1px solid #e2e8f0',

              display: 'flex',

              alignItems: 'center',

              gap: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontWeight: 800,

                  fontSize: 18,

                  color: '#0f172a',
                }}
              >
                {selectedStage2.app}
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,

                  color: '#64748b',

                  mt: 0.5,
                }}
              >
                {selectedStage2.appuuid}
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search logs..."
              value={logSearch}
              onChange={(e) =>
                setLogSearch(
                  e.target.value
                )
              }
              InputProps={{
                startAdornment: (
                  <SearchIcon
                    sx={{
                      mr: 1,

                      color:
                        '#94a3b8',

                      fontSize: 18,
                    }}
                  />
                ),
              }}
              sx={{
                width: {
                  xs: 150,
                  md: 260,
                },
              }}
            />

            <IconButton
              onClick={() =>
                setSelectedStage2(null)
              }
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* TABS */}

          <Tabs
            value={activeTab}
            onChange={(_, v) =>
              setActiveTab(v)
            }
            sx={{
              borderBottom:
                '1px solid #e2e8f0',

              px: 2,

              '& .MuiTab-root': {
                textTransform: 'none',

                fontWeight: 700,
              },
            }}
          >
            <Tab label="Logs" />
            <Tab label="Details" />
          </Tabs>

          {/* CONTENT */}

          <Box
            sx={{
              flex: 1,

              overflow: 'auto',
            }}
          >
            {/* LOGS */}

            {activeTab === 0 && (
              <Box sx={{ p: 2 }}>
                {filteredLogs.length ===
                0 ? (
                  <Typography
                    sx={{
                      textAlign: 'center',

                      mt: 4,

                      color: '#64748b',
                    }}
                  >
                    No logs found.
                  </Typography>
                ) : (
                  filteredLogs.map(
                    (
                      log: any,
                      idx: number
                    ) => (
                      <Paper
                        key={idx}
                        elevation={0}
                        sx={{
                          mb: 2,

                          borderRadius:
                            '18px',

                          overflow:
                            'hidden',

                          border:
                            log.severity ===
                            'ERROR'
                              ? '1px solid #ffcdd2'
                              : log.severity ===
                                'WARNING'
                              ? '1px solid #ffe082'
                              : '1px solid #e2e8f0',
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,

                            py: 1.5,

                            background:
                              log.severity ===
                              'ERROR'
                                ? '#ffebee'
                                : log.severity ===
                                  'WARNING'
                                ? '#fff8e1'
                                : '#f8fafc',

                            display: 'flex',

                            justifyContent:
                              'space-between',

                            alignItems:
                              'center',
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 700,

                              fontSize: 14,
                            }}
                          >
                            {log.app ||
                              selectedStage2.app}
                          </Typography>

                          <Chip
                            size="small"
                            label={
                              log.severity ||
                              'INFO'
                            }
                            sx={{
                              fontWeight: 700,

                              background:
                                log.severity ===
                                'ERROR'
                                  ? '#ffcdd2'
                                  : log.severity ===
                                    'WARNING'
                                  ? '#ffe082'
                                  : '#dbeafe',
                            }}
                          />
                        </Box>

                        <Divider />

                        <Box sx={{ p: 2 }}>
                          {Object.entries(
                            log
                          ).map(
                            ([key, val]) => (
                              <Box
                                key={key}
                                sx={{
                                  display:
                                    'flex',

                                  gap: 2,

                                  py: 1,

                                  borderBottom:
                                    '1px solid #f1f5f9',
                                }}
                              >
                                <Typography
                                  sx={{
                                    minWidth: 160,

                                    fontWeight: 700,

                                    color:
                                      '#334155',

                                    fontSize: 13,
                                  }}
                                >
                                  {key}
                                </Typography>

                                <Typography
                                  sx={{
                                    flex: 1,

                                    fontSize: 13,

                                    color:
                                      '#0f172a',

                                    wordBreak:
                                      'break-word',

                                    fontFamily:
                                      'monospace',
                                  }}
                                >
                                  {String(
                                    val
                                  )}
                                </Typography>
                              </Box>
                            )
                          )}
                        </Box>
                      </Paper>
                    )
                  )
                )}
              </Box>
            )}

            {/* DETAILS */}

            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography
                  sx={{
                    fontWeight: 700,

                    mb: 2,

                    fontSize: 18,
                  }}
                >
                  Application Details
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,

                    borderRadius:
                      '20px',

                    border:
                      '1px solid #e2e8f0',

                    background:
                      '#f8fafc',
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      sx={{
                        fontSize: 12,

                        color:
                          '#64748b',
                      }}
                    >
                      Application Name
                    </Typography>

                    <Typography
                      sx={{
                        fontWeight: 700,

                        fontSize: 15,
                      }}
                    >
                      {selectedStage2.app}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 12,

                        color:
                          '#64748b',
                      }}
                    >
                      UUID
                    </Typography>

                    <Typography
                      sx={{
                        fontFamily:
                          'monospace',

                        fontSize: 14,

                        wordBreak:
                          'break-all',
                      }}
                    >
                      {selectedStage2.appuuid}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default NewRelicTab;
