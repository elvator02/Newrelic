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
        width: {
          xs: 180,
          sm: 220,
          md: 250,
        },

        minWidth: {
          xs: 180,
          sm: 220,
          md: 250,
        },

        height: {
          xs: 72,
          sm: 90,
          md: 100,
        },

        borderRadius: 999,

        background: error
          ? 'linear-gradient(90deg,#ffebee 0%,#ffcdd2 100%)'
          : warning
          ? 'linear-gradient(90deg,#fff8e1 0%,#ffe082 100%)'
          : selected
          ? 'linear-gradient(90deg,#dbeafe 0%,#90caf9 100%)'
          : 'linear-gradient(90deg,#f8fbff 0%,#eef5ff 100%)',

        border: error
          ? '2px solid #d32f2f'
          : warning
          ? '2px solid #fbc02d'
          : selected
          ? '2px solid #1976d2'
          : '1.5px solid #dbeafe',

        boxShadow: selected
          ? '0 10px 24px rgba(25,118,210,0.20)'
          : '0 3px 10px rgba(0,0,0,0.06)',

        display: 'flex',

        flexDirection: 'column',

        justifyContent: 'center',

        alignItems: 'center',

        px: 2,

        cursor: 'pointer',

        transition: 'all 0.2s ease',

        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow:
            '0 12px 24px rgba(0,0,0,0.12)',
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
          fontWeight: 500,

          fontSize: {
            xs: 12,
            sm: 14,
          },

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

          mt: 0.4,

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

  const stage1Refs = useRef<
    Record<string, HTMLDivElement | null>
  >({});

  const stage2ContainerRef =
    useRef<HTMLDivElement | null>(null);

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

  /* =========================================================
     FETCH
  ========================================================= */

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

  /* =========================================================
     DATA
  ========================================================= */

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

  /* =========================================================
     ERROR HELPERS
  ========================================================= */

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

  return (
    <Box
      sx={{
        width: '100vw',

        minHeight: '100vh',

        background: '#f5f7fa',

        display: 'flex',

        flexDirection: 'column',

        alignItems: 'center',

        pb: selectedStage2
          ? { xs: '55vh', sm: '48vh' }
          : 5,
      }}
    >
      {/* =========================================================
          HEADER
      ========================================================= */}

      <Paper
        elevation={2}
        sx={{
          p: {
            xs: 1.5,
            sm: 3,
          },

          mb: 4,

          width: {
            xs: '98vw',
            sm: '95vw',
            md: '90vw',
            lg: 1200,
          },

          maxWidth: 1200,

          display: 'flex',

          flexDirection: 'column',

          alignItems: 'center',

          gap: 2,

          background: '#ffffff',

          borderRadius: 4,

          border: '1px solid #e2e8f0',

          mt: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,

            fontSize: {
              xs: 20,
              sm: 28,
            },
          }}
        >
          Transaction Tracing
        </Typography>

        <Box
          sx={{
            display: 'flex',

            flexDirection: isXs
              ? 'column'
              : 'row',

            gap: 2,

            alignItems: 'center',

            width: '100%',
          }}
        >
          <TextField
            value={transactionId}
            onChange={(e) =>
              setTransactionId(
                e.target.value
              )
            }
            placeholder="Enter Transaction ID"
            size="small"
            fullWidth
          />

          <Select
            size="small"
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
            {paymentFlowTypes.map((opt) => (
              <MenuItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
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
              minWidth: 170,

              borderRadius: 3,

              textTransform: 'none',

              fontWeight: 700,
            }}
          >
            {loading
              ? 'Fetching...'
              : 'Fetch Data'}
          </Button>
        </Box>

        {totalDuration > 0 && (
          <Typography
            sx={{
              fontWeight: 700,

              color: 'success.main',
            }}
          >
            Total Duration:{' '}
            {formatDuration(totalDuration)}
          </Typography>
        )}
      </Paper>

      {/* =========================================================
          STAGE 1 FLOW
      ========================================================= */}

      {stage1Results.length > 0 && (
        <Box
          sx={{
            width: {
              xs: '100vw',
              sm: '95vw',
              md: '90vw',
              lg: 1200,
            },

            overflowX: 'auto',

            pb: 3,

            px: 1,
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

                    opacity:
                      selectedStage1 &&
                      selectedStage1.uuid !==
                        stage.uuid
                        ? 0.45
                        : 1,

                    transition:
                      'opacity 0.25s ease',
                  }}
                >
                  <StagePill
                    stage={stage}
                    onClick={() => {
                      setSelectedStage1(
                        stage
                      );

                      setSelectedStage2(
                        null
                      );

                      setActiveTab(0);

                      setLogSearch('');

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
                              250,

                            behavior:
                              'smooth',
                          });
                        }
                      }, 120);
                    }}
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
                  />

                  {idx <
                    stage1Results.length -
                      1 && (
                    <Box
                      sx={{
                        width: {
                          xs: 60,
                          sm: 100,
                        },

                        display: 'flex',

                        flexDirection:
                          'column',

                        alignItems:
                          'center',

                        mx: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',

                          height: 2,

                          background:
                            'linear-gradient(to right,#90caf9,#1976d2)',

                          position:
                            'relative',
                        }}
                      >
                        <ArrowForwardIcon
                          sx={{
                            position:
                              'absolute',

                            right: -12,

                            top: -11,

                            color:
                              '#1976d2',

                            fontSize: 24,
                          }}
                        />
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,

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

      {/* =========================================================
          STAGE 2 FLOW
      ========================================================= */}

      {selectedStage1 && (
        <Box
          sx={{
            mt: 2,

            width: '100%',

            display: 'flex',

            flexDirection: 'column',

            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 2,

              height: 45,

              background:
                'linear-gradient(to bottom,#1976d2,transparent)',

              mb: 1,
            }}
          />

          <Typography
            sx={{
              fontWeight: 700,

              color: '#1976d2',

              fontSize: {
                xs: 15,
                sm: 18,
              },

              mb: 2,
            }}
          >
            Internal Service Calls —{' '}
            {selectedStage1.Stage ||
              selectedStage1.processing_stage}
          </Typography>

          <Box
            ref={stage2ContainerRef}
            sx={{
              display: 'flex',

              alignItems: 'center',

              overflowX: 'auto',

              width: {
                xs: '100vw',
                sm: '95vw',
                md: '90vw',
                lg: 1100,
              },

              pb: 2,

              px: 1,

              scrollBehavior: 'smooth',
            }}
          >
            {(
              fullData?.secondStage
                ?.result?.[
                selectedStage1.uuid
              ] || []
            ).map(
              (
                appObj: any,
                idx: number,
                arr: any[]
              ) => (
                <Box
                  key={appObj.appuuid}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    onClick={() => {
                      setSelectedStage2(
                        appObj
                      );

                      setActiveTab(0);

                      setLogSearch('');
                    }}
                    sx={{
                      width: 220,

                      minWidth: 220,

                      maxWidth: 220,

                      px: 2,

                      py: 2,

                      borderRadius: 4,

                      cursor: 'pointer',

                      transition:
                        'all 0.18s ease',

                      background:
                        hasErrorInApp(
                          appObj.appuuid
                        )
                          ? 'linear-gradient(135deg,#ffebee 0%,#ffcdd2 100%)'
                          : hasWarningInApp(
                              appObj.appuuid
                            )
                          ? 'linear-gradient(135deg,#fffde7 0%,#ffe082 100%)'
                          : selectedStage2?.appuuid ===
                            appObj.appuuid
                          ? 'linear-gradient(135deg,#bbdefb 0%,#90caf9 100%)'
                          : 'linear-gradient(135deg,#ffffff 0%,#f5f9ff 100%)',

                      border:
                        hasErrorInApp(
                          appObj.appuuid
                        )
                          ? '2px solid #d32f2f'
                          : hasWarningInApp(
                              appObj.appuuid
                            )
                          ? '2px solid #fbc02d'
                          : selectedStage2?.appuuid ===
                            appObj.appuuid
                          ? '2px solid #1976d2'
                          : '1.5px solid #dbeafe',

                      boxShadow:
                        selectedStage2?.appuuid ===
                        appObj.appuuid
                          ? '0 8px 24px rgba(25,118,210,0.25)'
                          : '0 2px 8px rgba(0,0,0,0.08)',

                      '&:hover': {
                        transform:
                          'translateY(-4px)',

                        boxShadow:
                          '0 10px 24px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,

                        fontSize: 14,

                        color:
                          hasErrorInApp(
                            appObj.appuuid
                          )
                            ? '#d32f2f'
                            : hasWarningInApp(
                                appObj.appuuid
                              )
                            ? '#f57f17'
                            : '#1565c0',

                        mb: 1,
                      }}
                    >
                      {appObj.app}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 11,

                        color: '#64748b',

                        wordBreak:
                          'break-all',
                      }}
                    >
                      {appObj.appuuid}
                    </Typography>
                  </Box>

                  {idx < arr.length - 1 && (
                    <Box
                      sx={{
                        width: 70,

                        mx: 1,

                        position:
                          'relative',
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',

                          height: 2,

                          background:
                            'linear-gradient(to right,#90caf9,#1976d2)',
                        }}
                      />

                      <ArrowForwardIcon
                        sx={{
                          position:
                            'absolute',

                          right: -10,

                          top: -11,

                          color:
                            '#1976d2',

                          fontSize: 22,
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )
            )}
          </Box>
        </Box>
      )}

      {/* =========================================================
          LOG PANEL
      ========================================================= */}

      {selectedStage2 && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',

            bottom: 0,

            left: 0,

            right: 0,

            height: {
              xs: '55vh',
              sm: '48vh',
            },

            background: '#ffffff',

            borderTop:
              '2px solid #e2e8f0',

            borderRadius:
              '20px 20px 0 0',

            display: 'flex',

            flexDirection: 'column',

            zIndex: 1200,

            overflow: 'hidden',
          }}
        >
          {/* HEADER */}

          <Box
            sx={{
              display: 'flex',

              alignItems: 'center',

              px: 3,

              py: 2,

              borderBottom:
                '1px solid #e2e8f0',

              gap: 2,
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                sx={{
                  fontWeight: 700,

                  color: '#1976d2',
                }}
              >
                {selectedStage2.app}
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,

                  color: '#64748b',
                }}
              >
                {selectedStage2.appuuid}
              </Typography>
            </Box>

            <TextField
              value={logSearch}
              onChange={(e) =>
                setLogSearch(
                  e.target.value
                )
              }
              placeholder="Search logs..."
              size="small"
              InputProps={{
                startAdornment: (
                  <SearchIcon
                    sx={{
                      fontSize: 16,
                      color: '#90a4ae',
                      mr: 0.5,
                    }}
                  />
                ),
              }}
              sx={{
                width: {
                  xs: 140,
                  sm: 240,
                },
              }}
            />

            <IconButton
              onClick={() => {
                setSelectedStage2(null);

                setLogSearch('');
              }}
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
            {activeTab === 0 && (
              <Box
                sx={{
                  p: 2,
                }}
              >
                {filteredLogs.map(
                  (log: any, idx: number) => (
                    <Paper
                      key={idx}
                      elevation={0}
                      sx={{
                        mb: 2,

                        borderRadius: 3,

                        border:
                          log.severity ===
                          'ERROR'
                            ? '1px solid #ffcdd2'
                            : log.severity ===
                              'WARNING'
                            ? '1px solid #ffe082'
                            : '1px solid #e2e8f0',

                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          px: 2,

                          py: 1.5,

                          display: 'flex',

                          justifyContent:
                            'space-between',

                          alignItems:
                            'center',

                          background:
                            log.severity ===
                            'ERROR'
                              ? '#ffebee'
                              : log.severity ===
                                'WARNING'
                              ? '#fff8e1'
                              : '#f8fafc',
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                          }}
                        >
                          {log.severity ||
                            'INFO'}
                        </Typography>

                        <Chip
                          size="small"
                          label={
                            log.timestamp ||
                            'LOG'
                          }
                        />
                      </Box>

                      <Box sx={{ p: 2 }}>
                        {Object.entries(log).map(
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
                                  minWidth: 140,

                                  fontWeight: 700,

                                  fontSize: 13,

                                  color:
                                    '#334155',
                                }}
                              >
                                {key}
                              </Typography>

                              <Typography
                                sx={{
                                  fontSize: 13,

                                  color:
                                    '#0f172a',

                                  wordBreak:
                                    'break-word',

                                  fontFamily:
                                    'monospace',
                                }}
                              >
                                {String(val)}
                              </Typography>
                            </Box>
                          )
                        )}
                      </Box>
                    </Paper>
                  )
                )}
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography
                  sx={{
                    fontWeight: 700,

                    mb: 2,
                  }}
                >
                  Application Details
                </Typography>

                <Typography>
                  App:{' '}
                  <strong>
                    {selectedStage2.app}
                  </strong>
                </Typography>

                <Typography sx={{ mt: 1 }}>
                  UUID:{' '}
                  <strong>
                    {
                      selectedStage2.appuuid
                    }
                  </strong>
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default NewRelicTab;
