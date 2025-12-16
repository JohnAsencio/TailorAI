import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendInterviewMessage } from '../../services/mockInterviewService';
import { getSavedResumeById } from '../../services/savedResumeService';
import { getCachedResume, cacheResume } from '../../utils/resumeCache';
import InterviewSettingsModal from './InterviewSettingsModal';
import GlowingBall from './GlowingBall';
import TranscriptionPanel from './TranscriptionPanel';
import InputControls from './InputControls';
import './MockInterviewPage.css';

export default function MockInterviewPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Interview state
  const [messages, setMessages] = useState([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const isInterviewActiveRef = useRef(false);
  const inputModeRef = useRef('voice');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Settings
  const [showSettings, setShowSettings] = useState(true);
  const [duration, setDuration] = useState(30); // minutes
  const [interviewerPersona, setInterviewerPersona] = useState('');
  const [interviewStage, setInterviewStage] = useState('beginning');
  
  // Resume data
  const [resumeData, setResumeData] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  
  // Speech recognition
  const [isListening, setIsListening] = useState(false);
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'
  const [textInput, setTextInput] = useState('');
  
  // Speech synthesis
  const synthRef = useRef(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownIntervalRef = useRef(null);
  const userResponseTimeoutRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const interimTranscriptRef = useRef('');
  const volumeIntervalRef = useRef(null);
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Check if resume ID or data was passed from navigation
  useEffect(() => {
    const resumeIdFromState = location.state?.resumeId;
    const resumeDataFromState = location.state?.resumeData;
    
    if (resumeIdFromState && user?.id) {
      // If resume data was passed directly, use it immediately
      if (resumeDataFromState && resumeDataFromState.id === resumeIdFromState) {
        setResumeData(resumeDataFromState);
        setResumeId(resumeIdFromState);
        // Cache it for future use
        cacheResume(resumeIdFromState, resumeDataFromState);
        return;
      }
      
      // Otherwise, only load if we don't already have this resume loaded
      if (!resumeData || resumeData.id !== resumeIdFromState) {
        loadResume(resumeIdFromState);
      }
    }
  }, [location.state?.resumeId, location.state?.resumeData, user?.id]);

  // Initialize speech recognition with auto-stop on silence
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        // If AI is speaking or we are not actively listening, ignore input
        if (isSpeaking || !isListening) {
          interimTranscriptRef.current = '';
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          return;
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update interim transcript
        interimTranscriptRef.current = interimTranscript;

        // Clear existing silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // If we have final transcript, process it immediately
        if (finalTranscript.trim()) {
          const fullText = (interimTranscriptRef.current + ' ' + finalTranscript).trim();
          // Use requestAnimationFrame for smoother state updates
          requestAnimationFrame(() => {
            handleUserMessage(fullText);
            setIsListening(false);
            recognitionRef.current.stop();
            interimTranscriptRef.current = '';
          });
        } else if (interimTranscript.trim()) {
          // User is speaking, reset silence timeout
          // If silence for 1.5 seconds, auto-submit and stop listening
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          silenceTimeoutRef.current = setTimeout(() => {
            if (interimTranscriptRef.current.trim() && isListening && !isSpeaking) {
              const finalText = interimTranscriptRef.current.trim();
              interimTranscriptRef.current = '';
              setIsListening(false);
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
              // Process the message
              requestAnimationFrame(() => {
                handleUserMessage(finalText);
              });
            }
          }, 1500); // 1.5 seconds of silence
        } else {
          // No speech detected, check if we should stop after silence
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          // If we had some transcript before but now nothing, wait a bit then stop
          if (interimTranscriptRef.current.trim()) {
            silenceTimeoutRef.current = setTimeout(() => {
              if (interimTranscriptRef.current.trim() && isListening && !isSpeaking) {
                const finalText = interimTranscriptRef.current.trim();
                interimTranscriptRef.current = '';
                setIsListening(false);
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                }
                requestAnimationFrame(() => {
                  handleUserMessage(finalText);
                });
              }
            }, 1500);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        if (event.error !== 'no-speech') {
          setError('Speech recognition error. Please try typing instead.');
        }
      };

      recognitionRef.current.onend = () => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        // Don't auto-restart - user will click to speak again
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      // Load voices (some browsers need this, especially Chrome)
      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        console.log('Available voices:', voices.length);
        // Log high-quality voices for debugging
        const qualityVoices = voices.filter(v => 
          v.name.includes('Google') || 
          v.name.includes('Samantha') || 
          v.name.includes('Aria') ||
          v.name.includes('Jenny')
        );
        if (qualityVoices.length > 0) {
          console.log('High-quality voices found:', qualityVoices.map(v => v.name));
        }
      };
      
      // Load voices immediately
      loadVoices();
      
      // Some browsers load voices asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Also try loading after a short delay (Chrome sometimes needs this)
      setTimeout(loadVoices, 100);
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isListening]);

  // Timer for interview duration
  useEffect(() => {
    if (!interviewStartTime || !isInterviewActive) return;
    
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - interviewStartTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [interviewStartTime, isInterviewActive]);

  // Waveform visualization while listening - create array of bar heights
  const [waveformHeights, setWaveformHeights] = useState(Array(20).fill(0.1));
  
  // Keep refs in sync with state
  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);
  
  useEffect(() => {
    isInterviewActiveRef.current = isInterviewActive;
  }, [isInterviewActive]);
  
  useEffect(() => {
    if (isListening) {
      volumeIntervalRef.current = setInterval(() => {
        // Generate waveform heights similar to iOS voice memos
        setWaveformHeights(prev => {
          const newHeights = prev.map((_, i) => {
            // Create a more natural waveform pattern
            const baseVolume = Math.random() * 0.7 + 0.2;
            // Add some variation based on position for more natural look
            const positionFactor = Math.sin(i * 0.3) * 0.2 + 1;
            return Math.min(1, Math.max(0.1, baseVolume * positionFactor));
          });
          return newHeights;
        });
      }, 100); // Update every 100ms for smooth animation
    } else {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
      }
      setWaveformHeights(Array(20).fill(0.1));
    }

    return () => {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
      }
    };
  }, [isListening]);

  const loadResume = async (id) => {
    if (!user?.id) return;
    
    // Check cache first
    const cached = getCachedResume(id);
    if (cached) {
      setResumeData(cached);
      setResumeId(id);
      return;
    }
    
    setLoadingResume(true);
    try {
      const result = await getSavedResumeById(id, user.id);
      if (result.success) {
        // Cache the resume data
        cacheResume(id, result.data);
        setResumeData(result.data);
        setResumeId(id);
      } else {
        setError('Failed to load resume');
      }
    } catch (err) {
      console.error('Error loading resume:', err);
      setError('Failed to load resume');
    } finally {
      setLoadingResume(false);
    }
  };

  const startInterview = async () => {
    if (!resumeData) {
      setError('Please select a resume first');
      return;
    }
    
    // Request microphone permission before starting interview
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted');
      } catch (err) {
        console.error('Microphone permission denied:', err);
        setError('Microphone permission is required for voice input');
        // Don't block interview start, but user will need to grant permission
      }
    }
    
    setShowSettings(false);
    setIsInterviewActive(true);
    isInterviewActiveRef.current = true;
    setMessages([]);
    setInterviewStage('beginning');
    setInterviewStartTime(Date.now());
    setElapsedTime(0);
    
    // Always start with AI greeting - send empty messages array so AI knows it's the first message
    setIsLoading(true);
    try {
      // Send empty messages array for the initial greeting
      const result = await sendInterviewMessage(
        [], // Empty array tells AI this is the first message
        resumeData?.tailored_resume_text || resumeData?.original_resume_text || '',
        resumeData?.job_description || '',
        resumeData?.job_title || '',
        interviewerPersona,
        'beginning'
      );
      
      if (result.success) {
        const greetingContent = result.message || 'Hi, welcome! How are you doing today?';
        const greeting = {
          role: 'assistant',
          content: greetingContent,
          timestamp: new Date().toISOString(),
        };
        setMessages([greeting]);
        speakText(greetingContent);
        // Start timeout after greeting
        setTimeout(() => {
          if (isInterviewActive && !isSpeaking) {
            startUserResponseTimeout();
          }
        }, 1000);
        
        // Auto-start countdown will be handled in utterance.onend
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setError('Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserMessage = async (text) => {
    // Clear user response timeout
    if (userResponseTimeoutRef.current) {
      clearTimeout(userResponseTimeoutRef.current);
      userResponseTimeoutRef.current = null;
    }
    
    // Handle "Are you still there?" prompt
    if (!text.trim()) {
      const stillThereMessage = {
        role: 'assistant',
        content: 'Are you still there?',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, stillThereMessage]);
      speakText('Are you still there?');
      return;
    }
    
    // Don't block on loading - allow messages to be sent
    // The loading state is handled in the main render
    
    // Optimize: Update state immediately for better UX
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    
    // Update messages immediately for instant feedback
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError('');
    
    const updatedMessages = [...messages, userMessage];
    
    try {
      const result = await sendInterviewMessage(
        updatedMessages,
        resumeData?.tailored_resume_text || resumeData?.original_resume_text || '',
        resumeData?.job_description || '',
        resumeData?.job_title || '',
        interviewerPersona,
        interviewStage
      );
      
      if (result.success) {
        const aiMessage = {
          role: 'assistant',
          content: result.message,
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Speak the AI response
        speakText(result.message);
        
        // Update interview stage
        if (interviewStage === 'beginning') {
          setInterviewStage('middle');
        } else if (result.message.toLowerCase().includes('any questions')) {
          setInterviewStage('ending');
        }
      } else {
        setError(result.error || 'Failed to get response');
        // Remove the user message if AI failed
        setMessages(prev => prev.slice(0, -1));
        // Still start timeout even if AI failed
        startUserResponseTimeout();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An error occurred. Please try again.');
      // Remove the user message if error occurred
      setMessages(prev => prev.slice(0, -1));
      // Still start timeout even if error occurred
      startUserResponseTimeout();
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    // If countdown is already running, don't start another
    if (countdownIntervalRef.current !== null) {
      return;
    }
    
    // Countdown before starting (3, 2, 1)
    let count = 3;
    setCountdown(count);
    
    countdownIntervalRef.current = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        // Start recognition after countdown
        if (recognitionRef.current) {
          try {
            interimTranscriptRef.current = '';
            setWaveformHeights(Array(20).fill(0.1));
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            console.error('Error starting recognition:', e);
            setIsListening(false);
            setError('Could not start speech recognition');
            setInputMode('text');
          }
        }
      }
    }, 1000);
  };

  const handleVoiceInput = (e) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in your browser');
      setInputMode('text');
      return;
    }
    
    if (isListening) {
      // Stop listening and process any interim transcript
      if (interimTranscriptRef.current.trim()) {
        handleUserMessage(interimTranscriptRef.current.trim());
        interimTranscriptRef.current = '';
      }
      recognitionRef.current.stop();
      setIsListening(false);
      setCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    } else {
      // Start listening immediately (no countdown for manual click)
      try {
        interimTranscriptRef.current = '';
        setWaveformHeights(Array(20).fill(0.1));
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsListening(false);
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

  const speakText = (text) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    setIsSpeaking(false);
    
    // Add natural pauses and improve text for better speech
    const processedText = text
      .replace(/\./g, '. ') // Add space after periods
      .replace(/\?/g, '? ') // Add space after questions
      .replace(/!/g, '! ') // Add space after exclamations
      .replace(/,/g, ', ') // Ensure commas have space
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // Optimized settings for Siri/TikTok-like natural voice
    utterance.rate = 0.95; // Slightly slower for clarity and naturalness
    utterance.pitch = 1.05; // Slightly higher pitch for friendlier, more energetic tone
    utterance.volume = 1;
    
    // Get all available voices
    const voices = synthRef.current.getVoices();
    
    // Priority list for natural, Siri-like voices (most natural first)
    const voicePriority = [
      // Google voices (most natural, Siri-like)
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Google UK English Female', lang: 'en-GB' },
      { name: 'Google UK English Male', lang: 'en-GB' },
      
      // macOS voices (very natural, Siri-like)
      { name: 'Samantha', lang: 'en-US' },
      { name: 'Samantha Premium', lang: 'en-US' },
      { name: 'Alex', lang: 'en-US' },
      { name: 'Victoria', lang: 'en-US' },
      { name: 'Karen', lang: 'en-AU' },
      
      // Microsoft voices (good quality)
      { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
      { name: 'Microsoft Aria - English (United States)', lang: 'en-US' },
      { name: 'Microsoft Jenny - English (United States)', lang: 'en-US' },
      
      // Other natural voices
      { name: 'Daniel', lang: 'en-GB' },
      { name: 'Moira', lang: 'en-IE' },
    ];
    
    // Find the best available voice
    let selectedVoice = null;
    
    // First, try to find exact matches from priority list
    for (const priority of voicePriority) {
      selectedVoice = voices.find(voice => 
        voice.name === priority.name || 
        (voice.name.includes(priority.name.split(' ')[0]) && voice.lang.startsWith(priority.lang.split('-')[0]))
      );
      if (selectedVoice) break;
    }
    
    // If no exact match, look for high-quality voices
    if (!selectedVoice) {
      // Prefer voices with "Google", "Samantha", "Aria", "Jenny" in name
      selectedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('google') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('aria') ||
        voice.name.toLowerCase().includes('jenny') ||
        voice.name.toLowerCase().includes('zira')
      );
    }
    
    // Fallback to any en-US female voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith('en-US') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.gender === 'female' ||
         voice.name.toLowerCase().includes('zira') ||
         voice.name.toLowerCase().includes('aria'))
      );
    }
    
    // Final fallback to any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('Using voice:', selectedVoice.name, selectedVoice.lang);
    }
    
    // Track when speech actually starts and ends
    utterance.onstart = () => {
      // Stop listening while AI speaks to avoid picking up its own voice
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        interimTranscriptRef.current = '';
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }
      setIsSpeaking(true);
      setIsPaused(false);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
      // Start timeout for user response
      startUserResponseTimeout();
      
      // Auto-start countdown immediately after AI finishes speaking
      // Use refs to get current values (avoid closure issues)
      setTimeout(() => {
        if (isInterviewActiveRef.current && inputModeRef.current === 'voice' && countdownIntervalRef.current === null) {
          console.log('Auto-starting countdown after AI speech');
          startCountdown();
        }
      }, 300);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      startUserResponseTimeout();
    };
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };
  
  const startUserResponseTimeout = () => {
    // Clear any existing timeout
    if (userResponseTimeoutRef.current) {
      clearTimeout(userResponseTimeoutRef.current);
    }
    
    // Set timeout for 15 seconds of inactivity
    userResponseTimeoutRef.current = setTimeout(() => {
      if (isInterviewActive && !isSpeaking && !isLoading) {
        handleUserMessage(''); // Empty message triggers "Are you still there?"
      }
    }, 15000);
  };
  
  const handlePause = () => {
    if (!synthRef.current) return;
    
    if (isPaused) {
      // Resume
      try {
        synthRef.current.resume();
        setIsPaused(false);
      } catch (e) {
        console.error('Error resuming speech:', e);
      }
    } else {
      // Pause
      try {
        synthRef.current.pause();
        setIsPaused(true);
      } catch (e) {
        console.error('Error pausing speech:', e);
      }
    }
  };

  const endInterview = () => {
    setIsInterviewActive(false);
    setMessages([]);
    setInterviewStage('beginning');
    setIsSpeaking(false);
    setIsPaused(false);
    setInterviewStartTime(null);
    setElapsedTime(0);
    
    // Clear timeouts
    if (userResponseTimeoutRef.current) {
      clearTimeout(userResponseTimeoutRef.current);
      userResponseTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    setWaveformHeights(Array(20).fill(0.1));
    
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    interimTranscriptRef.current = '';
    
    // Navigate back
    navigate('/mockinterview');
  };

  if (showSettings) {
    // Show loading state while resume is being loaded
    if (loadingResume) {
      return (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'transparent',
          zIndex: 9999
        }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid var(--card-border)',
            borderTop: '4px solid var(--header-subtitle-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      );
    }
    
    return (
      <div className="mock-interview-settings-page">
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
      </div>
    );
  }

  // Show loading state when starting interview
  if (isInterviewActive && isLoading && messages.length === 0) {
    return (
      <div className="mock-interview-page" style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        zIndex: 9999
      }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '4px solid var(--card-border)',
          borderTop: '4px solid var(--header-subtitle-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div className="mock-interview-page">
      <div className="interview-container">
        <div className="interview-header">
          <button className="back-button" onClick={endInterview}>
            <span className="material-icons">arrow_back</span>
            End Interview
          </button>
          <h2 className="interview-title">
            {resumeData?.job_title || 'Mock Interview'}
          </h2>
          {interviewStartTime && (
            <div className="interview-timer">
              {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
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
            <GlowingBall 
              isSpeaking={isSpeaking}
              isListening={isListening}
              isPaused={isPaused}
              messages={messages}
            />
          </div>

          <div className="interview-sidebar">
            <TranscriptionPanel messages={messages} />
          </div>
        </div>

        <div className="interview-controls">
          <div className="controls-row">
            <button
              className={`pause-button ${isPaused ? 'paused' : ''}`}
              onClick={handlePause}
              disabled={!isSpeaking && !isPaused}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              <span className="material-icons">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
            </button>
            <InputControls
              inputMode={inputMode}
              setInputMode={setInputMode}
              isListening={isListening}
              waveformHeights={waveformHeights}
              onVoiceClick={handleVoiceInput}
              textInput={textInput}
              setTextInput={setTextInput}
              onSubmit={handleTextSubmit}
              disabled={isLoading || !isInterviewActive || isSpeaking}
              countdown={countdown}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

