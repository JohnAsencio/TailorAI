import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendInterviewMessage } from '../../services/mockInterviewService';
import { getSavedResumeById } from '../../services/savedResumeService';
import { synthesizeSpeech, playAudio } from '../../services/ttsService';
import InterviewSettingsModal from './InterviewSettingsModal';
import InterviewerAvatar from './InterviewerAvatar';
import TranscriptionPanel from './TranscriptionPanel';
import InputControls from './InputControls';
import './MockInterviewPage.css';

export default function MockInterviewPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Interview state
  const [messages, setMessages] = useState([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Settings
  const [showSettings, setShowSettings] = useState(true);
  const [duration, setDuration] = useState(30); // minutes
  const [interviewerPersona, setInterviewerPersona] = useState('');
  const [interviewStage, setInterviewStage] = useState('beginning');
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(null);
  
  // Resume data
  const [resumeData, setResumeData] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  
  // Speech recognition
  const [isListening, setIsListening] = useState(false);
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'
  const [textInput, setTextInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [audioLevels, setAudioLevels] = useState(Array(20).fill(0.1));
  const [interviewerEnergy, setInterviewerEnergy] = useState(0);
  
  // Speech synthesis
  const synthRef = useRef(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);
  const inputModeRef = useRef(inputMode);
  const isInterviewActiveRef = useRef(isInterviewActive);
  const componentActiveRef = useRef(true);
  const isListeningRef = useRef(isListening);
  const isLoadingRef = useRef(isLoading);
  const countdownIntervalRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const countdownStartedRef = useRef(false);
  const autoStartFromCountdownRef = useRef(false);
  const recognitionStopRequestedRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const recognitionStartingRef = useRef(false);
  const processingMessageRef = useRef(false);
  const lastProcessedTextRef = useRef('');
  const finalTranscriptsRef = useRef([]);
  const lastFinalAtRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const lastSpeechTimeRef = useRef(null);
  const messagesRef = useRef([]);
  const interviewEndsAtRef = useRef(null);
  const interviewTimerIntervalRef = useRef(null);

  const normalizeSpokenTextForTurnDetection = (text) => {
    const s = String(text || '').toLowerCase();
    // Remove common filler / hesitation phrases that should NOT end the turn.
    // Keep it conservative (avoid stripping real content).
    const withoutFillers = s.replace(
      /\b(um+|uh+|erm+|hmm+|mm+|ah+|like|you know|i mean)\b/gi,
      ' '
    );
    return withoutFillers.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const countWords = (text) => {
    const t = String(text || '').trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  };

  const formatCountdown = (totalSeconds) => {
    if (!Number.isFinite(totalSeconds) || totalSeconds === null) return '';
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  };

  const getTimeRemainingSeconds = () => {
    const endsAt = interviewEndsAtRef.current;
    if (!endsAt) return null;
    return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  };

  const stopInterviewTimer = () => {
    if (interviewTimerIntervalRef.current) {
      clearInterval(interviewTimerIntervalRef.current);
      interviewTimerIntervalRef.current = null;
    }
  };

  const startInterviewTimer = (endsAtMs) => {
    interviewEndsAtRef.current = endsAtMs;
    stopInterviewTimer();
    setTimeRemainingSeconds(getTimeRemainingSeconds());
    interviewTimerIntervalRef.current = setInterval(() => {
      const next = getTimeRemainingSeconds();
      setTimeRemainingSeconds(next);
      if (next !== null && next <= 0) {
        stopInterviewTimer();
        setInterviewStage('ending');
      }
    }, 1000);
  };

  // External TTS (Audio element) visualization for avatar mouth movement
  const ttsAudioRef = useRef(null);
  const ttsAudioContextRef = useRef(null);
  const ttsAnalyserRef = useRef(null);
  const ttsSourceRef = useRef(null);
  const ttsAnimationFrameRef = useRef(null);
  
  // Keep refs in sync with state
  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);
  
  useEffect(() => {
    isInterviewActiveRef.current = isInterviewActive;
  }, [isInterviewActive]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    // When time is almost up, move to ending so the interviewer starts wrapping up.
    if (timeRemainingSeconds !== null && timeRemainingSeconds <= 120 && interviewStage !== 'ending') {
      setInterviewStage('ending');
    }
  }, [timeRemainingSeconds, interviewStage]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
    
    // Stop recognition immediately when AI starts speaking
    if (isSpeaking && isListening && recognitionRef.current) {
      console.log('AI started speaking, stopping recognition');
      recognitionStopRequestedRef.current = true;
      autoStartFromCountdownRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition when AI speaks:', e);
      }
      setIsListening(false);
      setInterimTranscript('');
      stopAudioVisualization();
    }
  }, [isSpeaking, isListening]);
  
  // Check if resume ID was passed from navigation
  useEffect(() => {
    componentActiveRef.current = true;
    const resumeIdFromState = location.state?.resumeId;
    if (resumeIdFromState && user?.id) {
      loadResume(resumeIdFromState);
    }
    return () => {
      componentActiveRef.current = false;
      // Ensure timers and audio are fully stopped on unmount (e.g., browser back)
      stopInterviewTimer();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      stopAudioVisualization();
      stopInterviewerAudioAnalysis();
      if (ttsAudioRef.current) {
        try {
          ttsAudioRef.current.pause();
          ttsAudioRef.current.currentTime = 0;
        } catch {}
        ttsAudioRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [location, user]);

  const stopInterviewerAudioAnalysis = () => {
    if (ttsAnimationFrameRef.current) {
      cancelAnimationFrame(ttsAnimationFrameRef.current);
      ttsAnimationFrameRef.current = null;
    }

    try {
      if (ttsSourceRef.current) {
        ttsSourceRef.current.disconnect();
      }
    } catch {}
    ttsSourceRef.current = null;

    try {
      if (ttsAnalyserRef.current) {
        ttsAnalyserRef.current.disconnect();
      }
    } catch {}
    ttsAnalyserRef.current = null;

    if (ttsAudioContextRef.current) {
      try {
        ttsAudioContextRef.current.close();
      } catch {}
      ttsAudioContextRef.current = null;
    }

    setInterviewerEnergy(0);
  };

  const startInterviewerAudioAnalysis = async (audioEl) => {
    // Clean slate for each new TTS clip
    stopInterviewerAudioAnalysis();
    ttsAudioRef.current = audioEl;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      ttsAudioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;

      const source = ctx.createMediaElementSource(audioEl);
      ttsSourceRef.current = source;
      ttsAnalyserRef.current = analyser;

      // Ensure audio actually reaches the speakers via the WebAudio graph.
      source.connect(analyser);
      analyser.connect(ctx.destination);

      // Some browsers start the context suspended until a user gesture.
      try {
        if (ctx.state === 'suspended') await ctx.resume();
      } catch {}

      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!ttsAnalyserRef.current) return;

        analyser.getByteTimeDomainData(data);

        // RMS (0..~1)
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const level = Math.min(1, rms * 3.0); // boost a bit so subtle speech still moves

        setInterviewerEnergy((prev) => prev * 0.7 + level * 0.3);
        ttsAnimationFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch (e) {
      // If analysis fails, the UI still animates using isSpeaking
      console.warn('Interviewer audio analysis failed:', e);
      stopInterviewerAudioAnalysis();
    }
  };

  // Reset countdown started flag when speaking starts (to allow new countdown when speaking stops)
  useEffect(() => {
    if (isSpeaking) {
      countdownStartedRef.current = false;
    }
  }, [isSpeaking]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Keep it continuous for better recognition
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;
      // Don't automatically stop on silence - wait for explicit stop
      // recognitionRef.current.serviceURI = ''; // Not available in all browsers
      finalTranscriptsRef.current = [];
      lastFinalAtRef.current = null;

      recognitionRef.current.onresult = (event) => {
        let interimText = '';
        let hasNewFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptsRef.current.push(transcript);
            hasNewFinal = true;
            // Update last speech time when we get final results
            lastSpeechTimeRef.current = Date.now();
            lastFinalAtRef.current = Date.now();
          } else {
            interimText += transcript;
          }
        }

        // Show interim results
        if (interimText) {
          setInterimTranscript(interimText);
        }

        // Reset idle timeout when we get speech
        if (hasNewFinal || interimText.trim().length > 0) {
          lastSpeechTimeRef.current = Date.now();
          // Clear idle timeout
          if (idleTimeoutRef.current) {
            clearTimeout(idleTimeoutRef.current);
            idleTimeoutRef.current = null;
          }
          // Set new idle timeout (30 seconds of no speech = stop listening)
          idleTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current && isInterviewActiveRef.current) {
              console.log('⏸️ No speech detected for 30 seconds, stopping recognition');
              recognitionStopRequestedRef.current = true;
              setIsListening(false);
              setInterimTranscript('');
              stopAudioVisualization();
              try {
                recognitionRef.current.stop();
              } catch (e) {
                // Ignore
              }
            }
          }, 30000); // 30 seconds
        }

        // Clear silence timeout when we get results
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        // If we have final results, process them after a short delay (in case more are coming)
        // Longer delay makes it feel more natural and reduces mid-sentence cutoffs.
        if (hasNewFinal && finalTranscriptsRef.current.length > 0) {
          // Clear any existing timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
          
          const candidateTextNow = finalTranscriptsRef.current.join(' ').trim();
          const normalizedNow = normalizeSpokenTextForTurnDetection(candidateTextNow);
          const wordCountNow = countWords(normalizedNow);

          // Dynamic delay: longer pauses before "end of turn" so we don't cut off mid-sentence
          const delayMs = wordCountNow < 4 ? 3200 : wordCountNow < 8 ? 2200 : 1500;

          silenceTimeoutRef.current = setTimeout(() => {
            // If we are still getting interim speech, wait a bit longer
            if (interimText && interimText.trim().length > 0) return;

            // If we got a final very recently, wait a touch longer
            if (lastFinalAtRef.current && Date.now() - lastFinalAtRef.current < 650) return;

            const completeText = finalTranscriptsRef.current.join(' ').trim();
            
            // Filter out filler-only / meaningless transcripts ("uhhh", "um", etc).
            // IMPORTANT: Do NOT stop listening in this case—just ignore and keep going.
            const normalized = normalizeSpokenTextForTurnDetection(completeText);
            const words = countWords(normalized);
            if (!normalized || normalized.length < 2 || words < 2) {
              finalTranscriptsRef.current = [];
              return;
            }
            
            if (completeText && !processingMessageRef.current) {
              // Check for duplicates
              if (completeText === lastProcessedTextRef.current && lastProcessedTextRef.current !== '') {
                finalTranscriptsRef.current = [];
                return;
              }
              
              // Add message to chat IMMEDIATELY for instant feedback
              const userMessage = {
                role: 'user',
                content: completeText,
                timestamp: new Date().toISOString(),
              };
              setMessages(prev => [...prev, userMessage]);
              messagesRef.current = [...(messagesRef.current || []), userMessage];

              // Clear interim transcript
              setInterimTranscript('');
              
              // Clear idle timeout
              if (idleTimeoutRef.current) {
                clearTimeout(idleTimeoutRef.current);
                idleTimeoutRef.current = null;
              }
              
              // Stop recognition
              recognitionStopRequestedRef.current = true;
              autoStartFromCountdownRef.current = false;
              setIsListening(false);
              
              const textToProcess = completeText;
              finalTranscriptsRef.current = [];
              
              try {
                recognitionRef.current.stop();
              } catch (e) {
                console.error('Error stopping recognition:', e);
              }
              
              // Process the message (sends to AI)
              handleUserMessage(textToProcess);
            } else {
              finalTranscriptsRef.current = [];
            }
          }, delayMs);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        // Don't stop on all errors - some are recoverable
        if (event.error === 'no-speech') {
          // No speech detected - don't auto-restart immediately, let onend handle it
          // This prevents rapid restart loops when waiting for user to speak
          console.log('No speech detected, will retry via onend handler');
        } else if (event.error === 'aborted') {
          // Recognition was aborted, that's fine
          if (!recognitionStopRequestedRef.current) {
            // Only update state if we didn't explicitly request stop
          setIsListening(false);
          }
        } else {
          setIsListening(false);
          autoStartFromCountdownRef.current = false;
          setError('Speech recognition error. Please try typing instead.');
        }
      };

      recognitionRef.current.onend = () => {
        // If we explicitly requested to stop, don't restart
        if (recognitionStopRequestedRef.current) {
          recognitionStopRequestedRef.current = false;
          autoStartFromCountdownRef.current = false;
          setIsListening(false);
          stopAudioVisualization();
          // Clear idle timeout
          if (idleTimeoutRef.current) {
            clearTimeout(idleTimeoutRef.current);
            idleTimeoutRef.current = null;
          }
          return;
        }
        
        // If recognition ended naturally (not stopped by us) and we're still supposed to be listening,
        // check if we should restart (only if actively listening and interview is active)
        if (isListeningRef.current && isInterviewActiveRef.current && !isSpeakingRef.current) {
          const tryRestart = (attempt = 0) => {
            if (
              !isListeningRef.current ||
              !isInterviewActiveRef.current ||
              recognitionStopRequestedRef.current ||
              recognitionStartingRef.current ||
              isSpeakingRef.current ||
              inputModeRef.current !== 'voice'
            ) return;
            try {
              recognitionRef.current.start();
            } catch (e) {
              if (e.name === 'InvalidStateError') {
                // Already running
              } else if (attempt < 2) {
                setTimeout(() => tryRestart(attempt + 1), 300);
              } else {
                console.error('Error restarting recognition:', e);
                setIsListening(false);
                stopAudioVisualization();
              }
            }
          };
          setTimeout(() => tryRestart(), 200);
        } else {
          // Not supposed to be listening, make sure we're stopped
          setIsListening(false);
          stopAudioVisualization();
          if (idleTimeoutRef.current) {
            clearTimeout(idleTimeoutRef.current);
            idleTimeoutRef.current = null;
          }
        }
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      // Load voices (some browsers need this, especially Chrome)
      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        // Silent - voices loaded
      };
      
      // Voices might not be loaded immediately, especially in Chrome
      // Try loading immediately
      loadVoices();
      
      // Chrome requires waiting for voiceschanged event
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
      
      // Also try loading after a short delay (Chrome sometimes needs this)
      setTimeout(loadVoices, 100);
      setTimeout(loadVoices, 500);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const loadResume = async (id) => {
    if (!user?.id) return;
    
    const result = await getSavedResumeById(id, user.id);
    if (result.success) {
      setResumeData(result.data);
      setResumeId(id);
    } else {
      setError('Failed to load resume');
    }
  };

  const startInterview = async () => {
    if (!resumeData) {
      setError('Please select a resume first');
      return;
    }
    
    setShowSettings(false);
    setIsInterviewActive(true);
    setMessages([]);
    setInterviewStage('beginning');
    const totalSeconds = Math.max(1, Math.round(duration * 60));
    startInterviewTimer(Date.now() + totalSeconds * 1000);
    
    // Start with AI greeting
    setIsLoading(true);
    try {
      const result = await sendInterviewMessage(
        [],
        resumeData?.tailored_resume_text || resumeData?.original_resume_text || '',
        resumeData?.job_description || '',
        resumeData?.job_title || '',
        interviewerPersona,
        'beginning',
        totalSeconds,
        duration
      );
      
      if (result.success) {
        const greeting = {
          role: 'assistant',
          content: result.message,
          timestamp: new Date().toISOString(),
        };
        setMessages([greeting]);
        messagesRef.current = [greeting];
        speakText(greeting.content);
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setError('Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserMessage = async (text) => {
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      console.log('Empty message, skipping');
      return;
    }
    
    // Check for duplicates FIRST, before any other checks
    if (trimmedText === lastProcessedTextRef.current && lastProcessedTextRef.current !== '') {
      console.log('⚠️ Duplicate message detected, ignoring:', trimmedText);
      return;
    }
    
    if (isLoading || processingMessageRef.current) {
      console.log('Skipping message - already processing or loading:', { 
        text: trimmedText, 
        isLoading, 
        processing: processingMessageRef.current 
      });
      return;
    }
    
    // Mark this text as being processed to prevent duplicates
    // Set it BEFORE processing to prevent race conditions
    lastProcessedTextRef.current = trimmedText;
    processingMessageRef.current = true;
    
    console.log('🔄 Starting to process user message:', trimmedText);
    setIsLoading(true);
    setError('');
    
    // Use latest messages (ref is updated when we add user message in onresult)
    const latestMessages = messagesRef.current?.length ? messagesRef.current : messages;
    const messageExists = latestMessages.some(m => m.role === 'user' && m.content === trimmedText);
    const userMessage = {
      role: 'user',
      content: trimmedText,
      timestamp: new Date().toISOString(),
    };
    const toSend = messageExists ? latestMessages : [...latestMessages, userMessage];
    if (!messageExists) {
      setMessages(prev => (prev.some(m => m.role === 'user' && m.content === trimmedText) ? prev : [...prev, userMessage]));
      messagesRef.current = toSend;
      console.log('✅ User message added to chat immediately:', trimmedText);
    }

    try {
      const remaining = getTimeRemainingSeconds();
      const result = await sendInterviewMessage(
        toSend,
        resumeData?.tailored_resume_text || resumeData?.original_resume_text || '',
        resumeData?.job_description || '',
        resumeData?.job_title || '',
        interviewerPersona,
        interviewStage,
        remaining,
        duration
      );
      
      // If component is no longer active (navigated away), ignore results
      if (!componentActiveRef.current) {
        processingMessageRef.current = false;
        return;
      }

      if (result.success) {
        console.log('✅ AI response received:', result.message.substring(0, 50) + '...');
        const aiMessage = {
          role: 'assistant',
          content: result.message,
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => {
          const next = [...prev, aiMessage];
          messagesRef.current = next;
          return next;
        });
        
        // Speak the AI response
        console.log('🔊 Speaking AI response');
        speakText(result.message);
        
        // Update interview stage
        if (interviewStage === 'beginning') {
          setInterviewStage('middle');
        } else if (result.message.toLowerCase().includes('any questions')) {
          setInterviewStage('ending');
        }
        
        // Reset flags to allow next input after AI finishes speaking
        // This will happen when speakText completes (in onend handler)
      } else {
        setError(result.error || 'Failed to get response');
        console.error('❌ AI response failed:', result.error);
        // Keep the user message even if AI failed - don't remove it
        // setMessages(prev => prev.slice(0, -1));
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setError('An error occurred. Please try again.');
      // Keep the user message even on error - don't remove it
      // setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      processingMessageRef.current = false;
      // Clear the processed text ref after a delay to allow retries
      setTimeout(() => {
        if (!processingMessageRef.current) {
          lastProcessedTextRef.current = '';
          console.log('🔄 Cleared processed text ref, ready for new input');
        }
      }, 5000); // Increased delay to prevent duplicate processing
      console.log('✅ Message processing complete');
    }
  };

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 32;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateLevels = () => {
        if (!analyserRef.current || !isListeningRef.current) {
          return;
        }
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Normalize and create waveform bars
        const levels = Array(20).fill(0).map((_, i) => {
          const index = Math.floor((i / 20) * bufferLength);
          return dataArray[index] / 255;
        });
        
        setAudioLevels(levels);
        animationFrameRef.current = requestAnimationFrame(updateLevels);
      };
      
      updateLevels();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      // Continue without visualization if mic access fails
    }
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.getTracks().forEach(track => track.stop());
      microphoneRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Clear idle timeout when stopping visualization
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    
    analyserRef.current = null;
    setAudioLevels(Array(20).fill(0.1));
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in your browser');
      setInputMode('text');
      return;
    }
    
    if (isListening) {
      // Stop listening and process any pending transcript
      recognitionStopRequestedRef.current = true;
      autoStartFromCountdownRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      setIsListening(false);
      setInterimTranscript('');
      stopAudioVisualization();
    } else {
      // If AI is speaking, allow barge-in (interrupt).
      if (isSpeaking || isSpeakingRef.current) {
        console.log('Barge-in: interrupting interviewer TTS');
        setError('');
        countdownStartedRef.current = false;
        setCountdown(null);
        stopInterviewerAudioAnalysis();
        if (ttsAudioRef.current) {
          try {
            ttsAudioRef.current.pause();
            ttsAudioRef.current.currentTime = 0;
          } catch {}
          ttsAudioRef.current = null;
        }
        if (synthRef.current) {
          try {
            synthRef.current.cancel();
          } catch {}
        }
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
      
      // Don't start if already starting
      if (recognitionStartingRef.current) {
        console.log('Recognition already starting, skipping');
        return;
      }
      
      // If already listening, stop and restart (allow toggle)
      if (isListening) {
        console.log('Already listening, toggling off');
        recognitionStopRequestedRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
        setIsListening(false);
        setInterimTranscript('');
        stopAudioVisualization();
        return;
      }
      
      // Reset processing flags to allow new input even if previous is still processing
      // This allows the user to interrupt and start fresh
      if (processingMessageRef.current) {
        console.log('⚠️ Previous message still processing, but allowing new input');
      }
      
      try {
        setInterimTranscript('');
        setCountdown(null); // Cancel any ongoing countdown
        recognitionStartingRef.current = true;
        
        // Always stop first to ensure clean state (even if it throws)
        try {
          recognitionRef.current.stop();
        } catch (stopErr) {
          // Ignore errors - recognition might not be running
          console.log('Stop error (expected if not running):', stopErr.message);
        }
        
        // Wait longer to ensure recognition is fully stopped
        setTimeout(() => {
          try {
            // Double-check state before starting
            if (isListeningRef.current || isSpeakingRef.current) {
              console.log('State changed, aborting start');
              recognitionStartingRef.current = false;
              return;
            }
            
            recognitionRef.current.start();
            setIsListening(true);
            setError('');
            recognitionStopRequestedRef.current = false;
            recognitionStartingRef.current = false;
            lastSpeechTimeRef.current = Date.now();
            // Start audio visualization
            startAudioVisualization();
            console.log('✅ Recognition started successfully');
            
            // Set idle timeout when starting recognition
            if (idleTimeoutRef.current) {
              clearTimeout(idleTimeoutRef.current);
            }
            idleTimeoutRef.current = setTimeout(() => {
              if (isListeningRef.current && isInterviewActiveRef.current) {
                console.log('⏸️ No speech detected for 30 seconds, stopping recognition');
                recognitionStopRequestedRef.current = true;
                setIsListening(false);
                setInterimTranscript('');
                stopAudioVisualization();
                try {
                  recognitionRef.current.stop();
                } catch (e) {
                  // Ignore
                }
              }
            }, 30000); // 30 seconds idle timeout
          } catch (startErr) {
            recognitionStartingRef.current = false;
            console.error('Error starting recognition:', startErr);
            
            // Handle InvalidStateError - recognition might already be running
            if (startErr.name === 'InvalidStateError') {
              console.log('Recognition already running, checking state...');
              // If it's already running, update our state to match
              if (!isListeningRef.current) {
                setIsListening(true);
                startAudioVisualization();
                console.log('Updated state to match running recognition');
              }
              return;
            }
            
            // Only switch to text mode if it's a critical error
            if (startErr.name === 'NotAllowedError' || startErr.name === 'NotFoundError') {
              setError('Microphone access denied or not available. Please use text input.');
              setInputMode('text');
            } else {
              // For other errors, try once more after longer delay
              console.log('Retrying recognition start after error...');
              setTimeout(() => {
                // Check state again
                if (isListeningRef.current || isSpeakingRef.current || recognitionStartingRef.current) {
                  console.log('State changed during retry, aborting');
                  return;
                }
                
                recognitionStartingRef.current = true;
                try {
                  // Stop again before retry
                  try {
                    recognitionRef.current.stop();
                  } catch (e) {
                    // Ignore
                  }
                  
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                  setIsListening(true);
                  setError('');
                      recognitionStopRequestedRef.current = false;
                      recognitionStartingRef.current = false;
                  startAudioVisualization();
                      console.log('✅ Recognition started on retry');
                } catch (retryErr) {
                      recognitionStartingRef.current = false;
                  console.error('Retry failed:', retryErr);
                      if (retryErr.name === 'InvalidStateError') {
                        // If it's already running, just update state
                        if (!isListeningRef.current) {
                          setIsListening(true);
                          startAudioVisualization();
                        }
                      } else {
                  setError('Could not start speech recognition. Please try clicking the button again.');
                }
            }
                  }, 300);
                } catch (e) {
                  recognitionStartingRef.current = false;
                  console.error('Error in retry setup:', e);
          }
              }, 800);
            }
          }
        }, 200); // Increased delay to ensure recognition is fully stopped
      } catch (e) {
        recognitionStartingRef.current = false;
        console.error('Error in handleVoiceInput:', e);
        setError('Could not start speech recognition. Please try again.');
      }
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleUserMessage(textInput);
      setTextInput('');
    }
  };

  const speakText = async (text) => {
    // Try external TTS API first for better quality (no voice preference - uses default)
    const ttsResult = await synthesizeSpeech(text, null);
    
    if (ttsResult.success && ttsResult.audioUrl) {
      // Use external TTS API audio
      console.log('Using external TTS API');
      // Stop any ongoing recognition immediately
      if (isListening && recognitionRef.current) {
        console.log('AI starting to speak, stopping recognition');
        recognitionStopRequestedRef.current = true;
        autoStartFromCountdownRef.current = false;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
        setIsListening(false);
        setInterimTranscript('');
        stopAudioVisualization();
      }
      setIsSpeaking(true);
      
      try {
        await playAudio(ttsResult.audioUrl, {
          onAudioCreated: (audioEl) => {
            startInterviewerAudioAnalysis(audioEl);
          },
          onEnded: () => {
            stopInterviewerAudioAnalysis();
          },
          onError: () => {
            stopInterviewerAudioAnalysis();
          },
        });
        console.log('🔊 External TTS finished playing');
        setIsSpeaking(false);
        
        // Start countdown immediately - no delay
        if (
          inputModeRef.current === 'voice' && 
          isInterviewActiveRef.current && 
          !countdownStartedRef.current
        ) {
          console.log('✅ Starting countdown immediately after AI finished (external TTS)');
          startAutoCountdown();
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        stopInterviewerAudioAnalysis();
        setIsSpeaking(false);
        // Fall back to browser TTS on playback error
        speakTextBrowser(text);
      }
    } else {
      // Fall back to browser TTS
      console.log('Falling back to browser TTS');
      speakTextBrowser(text);
    }
  };

  const speakTextBrowser = (text) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    setIsSpeaking(false);
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices - try multiple times as Chrome loads voices asynchronously
    let voices = synthRef.current.getVoices();
    
    // If no voices, wait a bit and try again (Chrome issue)
    if (voices.length === 0) {
      setTimeout(() => {
        voices = synthRef.current.getVoices();
        selectAndSpeak(voices, text);
      }, 100);
      return;
    }
    
    selectAndSpeak(voices, text);
  };

  const selectAndSpeak = (voices, text) => {
    if (!synthRef.current) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Always use best Google voices: Google US English, Google UK English Female, or Google UK English Male
    let voiceToUse = null;
    
    // Priority order: Google US English > Google UK English Female > Google UK English Male
    const preferredVoices = [
      'Google US English',
      'Google UK English Female',
      'Google UK English Male'
    ];
    
    // Try to find preferred voices
    for (const preferredVoice of preferredVoices) {
      voiceToUse = voices.find(voice => 
        voice.name === preferredVoice || 
        voice.name.includes(preferredVoice)
      );
      if (voiceToUse) {
        console.log('✅ Using preferred Google voice:', voiceToUse.name);
        break;
      }
    }
    
    // If preferred voices not found, try partial matches
    if (!voiceToUse) {
      voiceToUse = voices.find(voice => 
        voice.name.includes('Google US English') ||
        voice.name.includes('Google UK English')
      );
      if (voiceToUse) {
        console.log('✅ Using Google voice (partial match):', voiceToUse.name);
      }
    }
    
    // Fallback: Try any Google English voice if specific ones not found
    if (!voiceToUse) {
      voiceToUse = voices.find(voice => 
        voice.name.includes('Google') && 
        voice.lang.startsWith('en')
      );
      if (voiceToUse) {
        console.log('✅ Using Google voice (any match):', voiceToUse.name);
      }
    }
    
    // Last resort: any English voice
    if (!voiceToUse) {
      voiceToUse = voices.find(voice => voice.lang.startsWith('en-US')) || voices.find(voice => voice.lang.startsWith('en'));
      if (voiceToUse) {
        console.log('⚠️ Using fallback English voice:', voiceToUse.name);
      }
    }
    
    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.voiceURI = voiceToUse.voiceURI;
      // Force the voice to be used
      utterance.lang = voiceToUse.lang;
      console.log('🔊 Using voice:', voiceToUse.name);
    } else {
      console.warn('⚠️ No voice found, using browser default');
    }
    
    // More natural speech parameters (closer to human speech)
    // Adjust these for more natural-sounding speech
    utterance.rate = 0.92;      // Slightly slower for more natural, conversational pace
    utterance.pitch = 1.05;      // Slightly higher pitch for more pleasant sound
    utterance.volume = 1.0;      // Full volume
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      if (voiceToUse) {
        console.log('🔊 Speaking with voice:', voiceToUse.name);
      }
      // Stop any ongoing recognition immediately
      if (isListening && recognitionRef.current) {
        console.log('AI speech started, stopping recognition');
        recognitionStopRequestedRef.current = true;
        autoStartFromCountdownRef.current = false;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
        setIsListening(false);
        setInterimTranscript('');
        stopAudioVisualization();
      }
    };
    
    utterance.onend = () => {
      console.log('🔊 Browser TTS finished speaking');
      setIsSpeaking(false);
      // Start countdown immediately - no delay
      if (
        inputModeRef.current === 'voice' && 
        isInterviewActiveRef.current && 
        !countdownStartedRef.current
      ) {
        console.log('✅ Starting countdown immediately after AI finished (browser TTS)');
        startAutoCountdown();
      }
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      // Auto-start countdown even on error
      if (
        inputModeRef.current === 'voice' && 
        isInterviewActiveRef.current && 
        !countdownStartedRef.current &&
        !isListening
      ) {
        console.log('✅ AI speech error, starting countdown');
        startAutoCountdown();
      }
    };
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const startAutoCountdown = () => {
    console.log('🔔 startAutoCountdown called', {
      countdownStarted: countdownStartedRef.current,
      isListening,
      isSpeaking: isSpeakingRef.current,
      isLoading,
      countdown,
      inputMode: inputModeRef.current,
      isActive: isInterviewActiveRef.current
    });
    
    // Check if already started using ref (prevents duplicates)
    if (countdownStartedRef.current) {
      console.log('⚠️ Countdown already started, skipping');
      return;
    }
    
    // Don't check countdown state - if we're calling this, we want to start countdown
    // Only check critical blocking conditions
    if (isSpeakingRef.current) {
      console.log('⚠️ AI still speaking, waiting...');
      // Retry after a short delay
      setTimeout(() => {
        if (!isSpeakingRef.current && !countdownStartedRef.current) {
          startAutoCountdown();
        }
      }, 300);
      return;
    }
    
    if (isLoading) {
      console.log('⚠️ Still loading, waiting...');
      // Retry after a short delay
      setTimeout(() => {
        if (!isLoading && !countdownStartedRef.current) {
          startAutoCountdown();
        }
      }, 300);
      return;
    }
    
    // Ensure we're in voice mode
    if (inputModeRef.current !== 'voice') {
      console.log('⚠️ Not in voice mode, skipping countdown');
      return;
    }
    
    if (!isInterviewActiveRef.current) {
      console.log('⚠️ Interview not active, skipping countdown');
      return;
    }
    
    // Mark as started immediately to prevent duplicate starts
    countdownStartedRef.current = true;
    console.log('⏱️ Starting countdown: 3...');
    setCountdown(3);
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return null;
        }
        
        if (prev <= 1) {
          // Countdown finished - clear interval first
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          
          // Reset countdown state
          setCountdown(null);
          countdownStartedRef.current = false; // Reset so countdown can start again next time
          
          // Start listening automatically after countdown - IMMEDIATELY
          setTimeout(() => {
            // Use refs to get current values (state might be stale)
            const currentInputMode = inputModeRef.current;
            const currentIsActive = isInterviewActiveRef.current;
            const currentIsSpeaking = isSpeakingRef.current;
            
            console.log('Countdown finished, checking conditions:', {
              inputMode: currentInputMode,
              isActive: currentIsActive,
              isListening,
              isSpeaking: currentIsSpeaking
            });
            
            // Only start if all conditions are met
            if (
              currentInputMode === 'voice' && 
              currentIsActive && 
              !isListening && 
              !currentIsSpeaking &&
              !isLoading
            ) {
              console.log('✅ Auto-starting voice input after countdown');
              autoStartFromCountdownRef.current = true;
              recognitionStopRequestedRef.current = false;
              
              // Directly start recognition
              if (recognitionRef.current) {
                try {
                  try {
                    recognitionRef.current.stop();
                  } catch (e) {}
                  
                  setTimeout(() => {
                    try {
                      recognitionRef.current.start();
                      setIsListening(true);
                      setError('');
                      lastSpeechTimeRef.current = Date.now();
                      startAudioVisualization();
                      
                      // Set idle timeout (30 seconds)
                      if (idleTimeoutRef.current) {
                        clearTimeout(idleTimeoutRef.current);
                      }
                      idleTimeoutRef.current = setTimeout(() => {
                        if (isListening && isInterviewActiveRef.current) {
                          console.log('⏸️ No speech for 30s, stopping');
                          recognitionStopRequestedRef.current = true;
                          setIsListening(false);
                          setInterimTranscript('');
                          stopAudioVisualization();
                          try {
                            recognitionRef.current.stop();
                          } catch (e) {}
                        }
                      }, 30000);
                      
                      console.log('🎤 LISTENING NOW - ready for your response');
                    } catch (startErr) {
                      console.error('Error starting recognition:', startErr);
                      if (startErr.name === 'InvalidStateError') {
                        // Already running - that's fine
                        setIsListening(true);
                        startAudioVisualization();
                      } else {
                        // Retry once
                        setTimeout(() => {
                          try {
                            recognitionRef.current.start();
                            setIsListening(true);
                            startAudioVisualization();
                          } catch (e) {
                            console.error('Retry failed:', e);
                          }
                        }, 200);
                      }
                    }
                  }, 50); // Minimal delay for faster response
                } catch (e) {
                  console.error('Error in countdown auto-start:', e);
                }
              }
            } else {
              console.log('❌ Conditions not met for auto-start:', {
                inputMode: currentInputMode,
                isActive: currentIsActive,
                isListening,
                isSpeaking: currentIsSpeaking,
                isLoading
              });
            }
          }, 200); // Reduced delay for faster response
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endInterview = () => {
    componentActiveRef.current = false;
    setIsInterviewActive(false);
    setMessages([]);
    setInterviewStage('beginning');
    setIsSpeaking(false);
    setInterimTranscript('');
    setCountdown(null);
    setTimeRemainingSeconds(null);
    interviewEndsAtRef.current = null;
    stopInterviewTimer();
    countdownStartedRef.current = false; // Reset countdown flag
    stopInterviewerAudioAnalysis();
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
      } catch {}
      ttsAudioRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    stopAudioVisualization();
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors on cleanup
      }
      setIsListening(false);
    }
    // Navigate back to interview home
    navigate('/mockinterview', { replace: true });
  };

  if (showSettings) {
    return (
      <InterviewSettingsModal
        duration={duration}
        setDuration={setDuration}
        interviewerPersona={interviewerPersona}
        setInterviewerPersona={setInterviewerPersona}
        resumeData={resumeData}
        setResumeData={setResumeData}
        resumeId={resumeId}
        setResumeId={setResumeId}
        user={user}
        onStart={startInterview}
        onCancel={() => navigate('/mockinterview')}
        onLoadResume={loadResume}
      />
    );
  }

  return (
    <section className="mock-interview-page">
      <div className="simple-section-card">
        <div className="interview-header">
          <button className="back-button" onClick={endInterview}>
            <span className="material-icons">arrow_back</span>
            End Interview
          </button>
          <h2 className="interview-title">
            {resumeData?.job_title || 'Mock Interview'}
          </h2>
          {timeRemainingSeconds !== null && (
            <div
              className={[
                'interview-timer',
                timeRemainingSeconds <= 120 ? 'ending' : '',
              ].filter(Boolean).join(' ')}
              aria-label="Interview time remaining"
            >
              <span className="material-icons" aria-hidden="true">schedule</span>
              <span className="timer-text">{formatCountdown(timeRemainingSeconds)}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="error-alert animate-fade-in">
            <span className="material-icons">error_outline</span>
            <span>{error}</span>
          </div>
        )}

        <div className="interview-main">
          <div className="interview-center">
            <InterviewerAvatar
              isSpeaking={isSpeaking}
              isThinking={isLoading}
              isListening={isListening}
              messages={messages}
              energy={interviewerEnergy}
              name="Interviewer"
            />
          </div>

          <div className="interview-sidebar">
            <TranscriptionPanel 
              messages={messages} 
              isSpeaking={isSpeaking}
              interimTranscript={interimTranscript}
            />
          </div>
        </div>

        <div className="interview-controls">
          <InputControls
            inputMode={inputMode}
            setInputMode={setInputMode}
            isListening={isListening}
            onVoiceClick={handleVoiceInput}
            isSpeaking={isSpeaking}
            textInput={textInput}
            setTextInput={setTextInput}
            onSubmit={handleTextSubmit}
            disabled={isLoading || !isInterviewActive || isSpeaking}
            countdown={countdown}
            waveformHeights={audioLevels}
          />
        </div>
      </div>
    </section>
  );
}


