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
  const userResponseTimeoutRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const interimTranscriptRef = useRef('');
  const volumeIntervalRef = useRef(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  
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
          handleUserMessage(fullText);
          setIsListening(false);
          recognitionRef.current.stop();
          interimTranscriptRef.current = '';
        } else if (interimTranscript.trim()) {
          // User is speaking, reset silence timeout
          // If silence for 1.5 seconds, auto-submit
          silenceTimeoutRef.current = setTimeout(() => {
            if (interimTranscriptRef.current.trim() && isListening) {
              handleUserMessage(interimTranscriptRef.current.trim());
              setIsListening(false);
              recognitionRef.current.stop();
              interimTranscriptRef.current = '';
            }
          }, 1500);
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
      
      // Load voices (some browsers need this)
      const loadVoices = () => {
        synthRef.current.getVoices();
      };
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
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

  // Simulated volume meter while listening
  useEffect(() => {
    if (isListening) {
      volumeIntervalRef.current = setInterval(() => {
        setVolumeLevel(prev => {
          const target = Math.random() * 0.9 + 0.1;
          return prev * 0.5 + target * 0.5;
        });
      }, 120);
    } else {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
      }
      setVolumeLevel(0);
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
    
    setShowSettings(false);
    setIsInterviewActive(true);
    setMessages([]);
    setInterviewStage('beginning');
    
    // Always start with AI greeting - don't send empty messages array
    setIsLoading(true);
    try {
      // Create initial greeting message
      const greetingMessages = [{
        role: 'assistant',
        content: 'Hi, welcome! How are you doing today?'
      }];
      
      const result = await sendInterviewMessage(
        greetingMessages,
        resumeData?.tailored_resume_text || resumeData?.original_resume_text || '',
        resumeData?.job_description || '',
        resumeData?.job_title || '',
        interviewerPersona,
        'beginning'
      );
      
      if (result.success) {
        // Use the AI's response or fallback to our greeting
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
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    // Add user message first
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
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

  const handleVoiceInput = () => {
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
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    } else {
      try {
        interimTranscriptRef.current = '';
        setVolumeLevel(0);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setError('Could not start speech recognition');
        setInputMode('text');
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
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // More natural voice settings - slower and more conversational
    utterance.rate = 0.9; // Slightly slower for natural conversation
    utterance.pitch = 1.0; // Neutral pitch
    utterance.volume = 1;
    
    // Try to select a more natural, professional voice
    const voices = synthRef.current.getVoices();
    const preferredVoices = [
      'Google US English', // Most natural
      'Microsoft Zira - English (United States)',
      'Microsoft David - English (United States)', // Male professional voice
      'Samantha', // macOS natural voice
      'Alex', // macOS natural voice
      'Karen', // Australian English - very natural
      'Daniel', // UK English - natural
      'Microsoft Mark - English (United States)', // Professional male
    ];
    
    // Prefer female voices for interviewer (more common)
    const femaleVoices = voices.filter(voice => 
      preferredVoices.some(pref => voice.name.includes(pref)) &&
      (voice.name.toLowerCase().includes('zira') || 
       voice.name.toLowerCase().includes('samantha') ||
       voice.name.toLowerCase().includes('karen'))
    );
    
    const selectedVoice = femaleVoices[0] || 
      voices.find(voice => preferredVoices.some(pref => voice.name.includes(pref))) ||
      voices.find(voice => voice.lang.startsWith('en-US') && voice.name.includes('Female')) ||
      voices.find(voice => voice.lang.startsWith('en')) || 
      voices[0];
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
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
      utteranceRef.current = null;
      // Start timeout for user response
      startUserResponseTimeout();
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
    if (isPaused) {
      // Resume
      if (synthRef.current && utteranceRef.current) {
        synthRef.current.resume();
        setIsPaused(false);
      }
    } else {
      // Pause
      if (synthRef.current) {
        synthRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const endInterview = () => {
    setIsInterviewActive(false);
    setMessages([]);
    setInterviewStage('beginning');
    setIsSpeaking(false);
    setIsPaused(false);
    
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
    setVolumeLevel(0);
    
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    interimTranscriptRef.current = '';
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
              volumeLevel={volumeLevel}
              onVoiceClick={handleVoiceInput}
              textInput={textInput}
              setTextInput={setTextInput}
              onSubmit={handleTextSubmit}
              disabled={isLoading || !isInterviewActive || isSpeaking}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

