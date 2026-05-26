import { useState } from 'react';
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
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { getNewRelicData } from '@/RunningWorkflows/apiService';

// Helper to check if any log for an app has severity ERROR or WARNING
const hasErrorLog = (logs: any[] = []) =>
  logs.some((log: any) => log.severity === 'ERROR');
const hasWarningLog = (logs: any[] = []) =>
  logs.some((log: any) => log.severity === 'WARNING');

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
  if (ms < 60000) return `${(ms / 1000).toFixed(2)} s`;
  return `${(ms / 60000).toFixed(2)} min`;
}

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
        width: { xs: 180, sm: 220, md: 260 },
        minWidth: { xs: 180, sm: 220, md: 260 },
        maxWidth: { xs: 180, sm: 220, md: 260 },
        height: { xs: 70, sm: 90, md: 100 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: { xs: 2, sm: 3 },
        py: 0,
        borderRadius: 999,
        background: error
          ? 'linear-gradient(90deg, #ffebee 0%, #ffcdd2 100%)'
          : warning
          ? 'linear-gradient(90deg, #fffde7 0%, #ffe082 100%)'
          : selected
          ? 'linear-gradient(90deg, #e3f2fd 0%, #90caf9 100%)'
          : 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
        boxShadow: selected ? 8 : 3,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': { boxShadow: 8, transform: 'scale(1.05)' },
        border: error
          ? '2.5px solid #d32f2f'
          : warning
          ? '2.5px solid #fbc02d'
          : selected
          ? '2.5px solid #1976d2'
          : '2px solid #90caf9',
        mx: { xs: 0.5, sm: 1 },
        userSelect: 'none',
        color: error ? '#d32f2f' : warning ? '#fbc02d' : undefined,
        fontWeight: error || warning ? 700 : undefined,
        wordBreak: 'break-word',
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="subtitle2"
        color={error ? 'error' : warning ? 'warning.main' : 'primary'}
        sx={{ fontWeight: 600, fontSize: { xs: 14, sm: 16 }, whiteSpace: 'nowrap' }}
      >
        {stage.Stage || stage.processing_stage}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, fontSize: { xs: 13, sm: 15 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {stage.Substage || stage.processing_substage}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: { xs: 11, sm: 13 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {stage.app}
      </Typography>
    </Box>
  );
};

const NewRelicTab = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.down('md'));

  const [transactionId, setTransactionId] = useState('');
  const [paymentFlowType, setPaymentFlowType] = useState(paymentFlowTypes[0].value);
  const [fullData, setFullData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedStage1, setSelectedStage1] = useState<any | null>(null);
  const [selectedStage2, setSelectedStage2] = useState<any | null>(null);

  // Bottom panel tab state
  const [activeTab, setActiveTab] = useState(0);
  const [logSearch, setLogSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setFullData(null);
    setSelectedStage1(null);
    setSelectedStage2(null);
    try {
      const result = await getNewRelicData(transactionId, paymentFlowType);
      setFullData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const stage1Results = fullData?.firstStage?.results || [];
  const timeDiffs =
    stage1Results.length > 1
      ? stage1Results.slice(1).map((stage: any, idx: number) =>
          Number(stage.timestamp) - Number(stage1Results[idx].timestamp)
        )
      : [];
  const totalDuration =
    stage1Results.length > 1
      ? Number(stage1Results[stage1Results.length - 1].timestamp) -
        Number(stage1Results[0].timestamp)
      : 0;

  // Helper: does any app in this stage have error or warning logs?
  const hasErrorInStage1 = (stage1uuid: string) => {
    const apps = fullData?.secondStage?.result?.[stage1uuid] || [];
    return apps.some((app: any) =>
      hasErrorLog(fullData?.thirdStage?.result?.[app.appuuid])
    );
  };
  const hasWarningInStage1 = (stage1uuid: string) => {
    const apps = fullData?.secondStage?.result?.[stage1uuid] || [];
    return apps.some((app: any) =>
      hasWarningLog(fullData?.thirdStage?.result?.[app.appuuid])
    );
  };

  const hasErrorInApp = (appuuid: string) =>
    hasErrorLog(fullData?.thirdStage?.result?.[appuuid]);
  const hasWarningInApp = (appuuid: string) =>
    hasWarningLog(fullData?.thirdStage?.result?.[appuuid]);

  // Logs for the selected stage 2 app
  const selectedAppLogs: any[] =
    (selectedStage2 && fullData?.thirdStage?.result?.[selectedStage2.appuuid]) || [];

  const filteredLogs = logSearch
    ? selectedAppLogs.filter((log: any) =>
        Object.values(log).some((v) =>
          String(v).toLowerCase().includes(logSearch.toLowerCase())
        )
      )
    : selectedAppLogs;

  const hasBottomPanel = !!selectedStage2;

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        background: '#f5f7fa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        pb: hasBottomPanel ? { xs: '55vh', sm: '48vh' } : { xs: 2, sm: 6 },
      }}
    >
      {/* ── Header / Search Paper ── */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 1, sm: 3 },
          mb: 4,
          width: { xs: '98vw', sm: '95vw', md: '90vw', lg: 1200 },
          maxWidth: 1200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          boxSizing: 'border-box',
          background: '#ffffff',
          borderRadius: 3,
          border: '1px solid #e0e7ef',
          mt: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 1, fontSize: { xs: 18, sm: 24 } }}
        >
          NewRelic Transaction Flow
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: isXs ? 'column' : 'row',
            gap: 2,
            alignItems: 'center',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <TextField
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter Transaction ID"
            size="small"
            sx={{ width: { xs: '100%', sm: 250 } }}
          />
          <Select
            size="small"
            sx={{ minWidth: { xs: 120, sm: 150 } }}
            value={paymentFlowType}
            onChange={(e) => setPaymentFlowType(e.target.value as string)}
            displayEmpty
          >
            {paymentFlowTypes.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            onClick={fetchData}
            disabled={loading || !transactionId}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Fetch Data
          </Button>
        </Box>

        {totalDuration > 0 && (
          <Typography
            sx={{ fontWeight: 500, color: 'success.main', mt: 1, fontSize: { xs: 13, sm: 16 } }}
          >
            Total Duration: {formatDuration(totalDuration)}
          </Typography>
        )}
      </Paper>

      {loading && (
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading...</Typography>
      )}
      {error && (
        <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      )}

      {/* ── Stage 1 Pills ── */}
      {stage1Results.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 2,
            overflowX: 'auto',
            pb: 4,
            width: { xs: '100vw', sm: '95vw', md: '90vw', lg: 1200 },
            maxWidth: 1200,
          }}
        >
          {stage1Results.map((stage: any, idx: number) => (
            <Box key={stage.uuid} sx={{ display: 'flex', alignItems: 'center' }}>
              <StagePill
                stage={stage}
                onClick={() => {
                  setSelectedStage1(stage);
                  setSelectedStage2(null);
                  setActiveTab(0);
                  setLogSearch('');
                }}
                error={hasErrorInStage1(stage.uuid)}
                warning={hasWarningInStage1(stage.uuid)}
                selected={selectedStage1?.uuid === stage.uuid}
              />
              {idx < stage1Results.length - 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mx: { xs: 0.5, sm: 1 },
                  }}
                >
                  <ArrowForwardIcon
                    sx={{ fontSize: { xs: 28, sm: 48 }, color: '#1976d2' }}
                  />
                  <Typography
                    variant="caption"
                    color="secondary"
                    sx={{ fontWeight: 600, fontSize: { xs: 10, sm: 13 } }}
                  >
                    {formatDuration(timeDiffs[idx])}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* ── Stage 2: App Names for selected Stage 1 ── */}
      {selectedStage1 && (
        <Box
          sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
        >
          <ArrowForwardIcon
            sx={{
              transform: 'rotate(90deg)',
              fontSize: { xs: 28, sm: 48 },
              color: '#1976d2',
              mb: 1,
              filter: 'drop-shadow(0 2px 4px #90caf9)',
            }}
          />
          <Box
            sx={{
              display: 'flex',
              mt: 2,
              alignItems: 'center',
              overflowX: 'auto',
              width: { xs: '100vw', sm: '95vw', md: '90vw', lg: 1100 },
              maxWidth: 1100,
              justifyContent: 'flex-start',
              pb: 2,
            }}
          >
            {(fullData?.secondStage?.result?.[selectedStage1.uuid] || []).map(
              (appObj: any, idx: number, arr: any[]) => (
                <Box key={appObj.appuuid} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: { xs: 180, sm: 260, md: 320 },
                      minWidth: { xs: 120, sm: 180, md: 200 },
                      maxWidth: { xs: 220, sm: 320, md: 400 },
                      px: 0,
                      py: { xs: 1.5, sm: 2.5 },
                      borderRadius: 4,
                      background: hasErrorInApp(appObj.appuuid)
                        ? 'linear-gradient(90deg, #ffebee 0%, #ffcdd2 100%)'
                        : hasWarningInApp(appObj.appuuid)
                        ? 'linear-gradient(90deg, #fffde7 0%, #ffe082 100%)'
                        : selectedStage2?.appuuid === appObj.appuuid
                        ? 'linear-gradient(90deg, #bbdefb 0%, #90caf9 100%)'
                        : 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
                      cursor: 'pointer',
                      border: hasErrorInApp(appObj.appuuid)
                        ? '2.5px solid #d32f2f'
                        : hasWarningInApp(appObj.appuuid)
                        ? '2.5px solid #fbc02d'
                        : selectedStage2?.appuuid === appObj.appuuid
                        ? '2.5px solid #1976d2'
                        : '1.5px solid #90caf9',
                      color: hasErrorInApp(appObj.appuuid)
                        ? '#d32f2f'
                        : hasWarningInApp(appObj.appuuid)
                        ? '#fbc02d'
                        : undefined,
                      boxShadow: selectedStage2?.appuuid === appObj.appuuid ? 8 : 3,
                      textAlign: 'center',
                      mx: { xs: 1, sm: 2 },
                      transition: 'all 0.18s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      '&:hover': {
                        boxShadow: 12,
                        transform: 'scale(1.07)',
                        border: hasErrorInApp(appObj.appuuid)
                          ? '2.5px solid #d32f2f'
                          : hasWarningInApp(appObj.appuuid)
                          ? '2.5px solid #fbc02d'
                          : '2.5px solid #1976d2',
                      },
                    }}
                    onClick={() => {
                      setSelectedStage2(appObj);
                      setActiveTab(0);
                      setLogSearch('');
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: hasErrorInApp(appObj.appuuid)
                          ? '#d32f2f'
                          : hasWarningInApp(appObj.appuuid)
                          ? '#fbc02d'
                          : 'primary',
                        fontSize: { xs: 10, sm: 12 },
                        wordBreak: 'break-all',
                      }}
                    >
                      {appObj.app}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: 10, sm: 12 }, wordBreak: 'break-all' }}
                    >
                      {appObj.appuuid}
                    </Typography>
                  </Box>

                  {/* Arrow between apps, except after the last one */}
                  {idx < arr.length - 1 && (
                    <ArrowForwardIcon
                      sx={{
                        fontSize: { xs: 24, sm: 44 },
                        color: '#42a5f5',
                        mx: { xs: 1, sm: 2 },
                        flexShrink: 0,
                        filter: 'drop-shadow(0 2px 4px #bbdefb)',
                      }}
                    />
                  )}
                </Box>
              )
            )}
          </Box>
        </Box>
      )}

      {stage1Results.length === 0 && !loading && !error && (
        <Typography sx={{ mt: 2, textAlign: 'center', fontSize: { xs: 13, sm: 16 } }}>
          No data found.
        </Typography>
      )}

      {/* ══════════════════════════════════════════════
          BOTTOM PANEL — Design 3 style
          Slides up from bottom when a Stage 2 app is selected
      ══════════════════════════════════════════════ */}
      {hasBottomPanel && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: { xs: '55vh', sm: '48vh' },
            background: '#ffffff',
            borderTop: '2px solid #e0e7ef',
            borderRadius: '16px 16px 0 0',
            boxShadow: '0 -4px 32px rgba(25, 118, 210, 0.10)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1200,
            transition: 'height 0.3s cubic-bezier(.4,0,.2,1)',
            overflow: 'hidden',
          }}
        >
          {/* Panel Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: { xs: 1.5, sm: 3 },
              pt: 1.5,
              pb: 0.5,
              borderBottom: '1px solid #e0e7ef',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {/* Service name + status badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 13, sm: 16 },
                  color: '#1976d2',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: 120, sm: 300 },
                }}
              >
                {selectedStage2?.app}
              </Typography>
              <Chip
                label={
                  hasErrorInApp(selectedStage2?.appuuid)
                    ? 'Error'
                    : hasWarningInApp(selectedStage2?.appuuid)
                    ? 'Warning'
                    : 'Success'
                }
                size="small"
                sx={{
                  background: hasErrorInApp(selectedStage2?.appuuid)
                    ? '#ffcdd2'
                    : hasWarningInApp(selectedStage2?.appuuid)
                    ? '#ffe082'
                    : '#c8e6c9',
                  color: hasErrorInApp(selectedStage2?.appuuid)
                    ? '#b71c1c'
                    : hasWarningInApp(selectedStage2?.appuuid)
                    ? '#f57f17'
                    : '#2e7d32',
                  fontWeight: 700,
                  fontSize: 11,
                  height: 22,
                  flexShrink: 0,
                }}
              />
            </Box>

            {/* Search */}
            <TextField
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Search logs..."
              size="small"
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ fontSize: 16, color: '#90a4ae', mr: 0.5 }} />
                ),
              }}
              sx={{
                width: { xs: 120, sm: 200 },
                '& .MuiOutlinedInput-root': { fontSize: 13 },
              }}
            />

            {/* Filter button */}
            <Button
              startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
              size="small"
              variant="outlined"
              sx={{ fontSize: 12, height: 32, flexShrink: 0 }}
            >
              Filter
            </Button>

            {/* Close */}
            <IconButton
              size="small"
              onClick={() => {
                setSelectedStage2(null);
                setLogSearch('');
              }}
              sx={{ ml: 'auto', flexShrink: 0 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              minHeight: 36,
              px: { xs: 1, sm: 3 },
              borderBottom: '1px solid #e0e7ef',
              '& .MuiTab-root': { fontSize: 13, minHeight: 36, py: 0.5 },
            }}
          >
            <Tab label="Logs" />
            <Tab label="Details" />
            <Tab label="Metrics" />
            <Tab label="Attributes" />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 0, sm: 0 } }}>
            {activeTab === 0 && (
              /* ── Logs Table ── */
              <Box sx={{ maxHeight: '100%', overflowY: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: isXs ? 11 : 14,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      {Object.keys(
                        (fullData?.thirdStage?.result?.[selectedStage2.appuuid]?.[0] || {})
                      ).map((key) => (
                        <th
                          key={key}
                          style={{
                            padding: isXs ? '8px 6px' : '12px 10px',
                            borderBottom: '2.5px solid #90caf9',
                            color: '#1976d2',
                            fontWeight: 800,
                            textAlign: 'left',
                            background: 'inherit',
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                            fontSize: isXs ? 12 : 15,
                            letterSpacing: 0.5,
                          }}
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log: any, idx: number) => (
                      <tr
                        key={idx}
                        style={{
                          background:
                            log.severity === 'ERROR'
                              ? '#ffebee'
                              : log.severity === 'WARNING'
                              ? '#fffde7'
                              : idx % 2 === 0
                              ? '#f7fbff'
                              : '#ffffff',
                          transition: 'background 0.2s',
                        }}
                      >
                        {Object.entries(log).map(([key, val], i) => (
                          <td
                            key={i}
                            style={{
                              padding: isXs ? '7px 6px' : '10px 10px',
                              borderBottom: '1px solid #e3e3e3',
                              fontFamily: 'monospace',
                              fontSize: isXs ? 11 : 14,
                              color:
                                key === 'severity' && val === 'ERROR'
                                  ? '#d32f2f'
                                  : key === 'severity' && val === 'WARNING'
                                  ? '#e8b841ff'
                                  : log.severity === 'ERROR'
                                  ? '#d32f2f'
                                  : log.severity === 'WARNING'
                                  ? '#e8b841ff'
                                  : '#333',
                              fontWeight:
                                log.severity === 'ERROR' || log.severity === 'WARNING'
                                  ? 700
                                  : 400,
                              wordBreak: 'break-word',
                            }}
                          >
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* Empty state */}
                    {(!fullData?.thirdStage?.result?.[selectedStage2.appuuid] ||
                      fullData?.thirdStage?.result?.[selectedStage2.appuuid]?.length === 0) && (
                      <tr>
                        <td
                          colSpan={
                            Object.keys(
                              fullData?.thirdStage?.result?.[selectedStage2.appuuid]?.[0] || {}
                            ).length
                          }
                          style={{
                            textAlign: 'center',
                            padding: 20,
                            color: '#888',
                            fontSize: isXs ? 12 : 16,
                          }}
                        >
                          No logs found for this app.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary">
                  App: <strong>{selectedStage2?.app}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  UUID: <strong>{selectedStage2?.appuuid}</strong>
                </Typography>
              </Box>
            )}

            {activeTab === 2 && (
              <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary">
                  Metrics view coming soon.
                </Typography>
              </Box>
            )}

            {activeTab === 3 && (
              <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary">
                  Attributes view coming soon.
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
