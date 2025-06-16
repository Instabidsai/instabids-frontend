'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { AlertCircle, CheckCircle2, Loader2, Send, Activity, Wifi, WifiOff, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FormData {
  title: string;
  description: string;
  budget: string;
  timeline: string;
  skills: string;
  location: string;
  experience_level: string;
}

interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'active' | 'completed' | 'error';
  progress: number;
  current_task?: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  status: 'info' | 'success' | 'error';
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    budget: '',
    timeline: '',
    skills: '',
    location: '',
    experience_level: 'intermediate'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [wsReconnectAttempts, setWsReconnectAttempts] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'orchestrator', name: 'Orchestrator Agent', status: 'idle', progress: 0 },
    { id: 'analyst', name: 'Market Analyst', status: 'idle', progress: 0 },
    { id: 'proposal', name: 'Proposal Writer', status: 'idle', progress: 0 },
    { id: 'pricing', name: 'Pricing Strategist', status: 'idle', progress: 0 },
    { id: 'quality', name: 'Quality Assurance', status: 'idle', progress: 0 }
  ]);

  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Make form data readable by CopilotKit
  useCopilotReadable({
    description: "Current project form data",
    value: formData
  });

  useCopilotReadable({
    description: "Current agent statuses and progress",
    value: agents
  });

  useCopilotReadable({
    description: "WebSocket connection status",
    value: { connected: wsConnected, reconnectAttempts: wsReconnectAttempts }
  });

  // CopilotKit actions
  useCopilotAction({
    name: "fillProjectForm",
    description: "Help fill out the project submission form",
    parameters: [
      { name: "title", type: "string", description: "Project title" },
      { name: "description", type: "string", description: "Project description" },
      { name: "budget", type: "string", description: "Project budget" },
      { name: "timeline", type: "string", description: "Project timeline" },
      { name: "skills", type: "string", description: "Required skills" },
      { name: "location", type: "string", description: "Location preference" },
      { name: "experience_level", type: "string", description: "Experience level required" }
    ],
    handler: async (params) => {
      setFormData(prev => ({
        ...prev,
        ...params
      }));
      return "Form fields updated successfully";
    },
  });

  useCopilotAction({
    name: "getAgentStatus",
    description: "Get the current status of all agents",
    handler: async () => {
      const statusSummary = agents.map(agent => ({
        name: agent.name,
        status: agent.status,
        progress: `${agent.progress}%`,
        currentTask: agent.current_task || 'None'
      }));
      return statusSummary;
    },
  });

  const connectWebSocket = useCallback(() => {
    if (!projectId) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/${projectId}`;
    console.log('Connecting to WebSocket:', wsUrl);

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
      setWsReconnectAttempts(0);
      addActivityLog('system', 'WebSocket connected', 'success');
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);

        if (data.agent && data.state) {
          updateAgentStatus(data.agent, data.state);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      addActivityLog('system', 'WebSocket disconnected', 'error');

      // Attempt to reconnect after delay
      if (wsReconnectAttempts < 5) {
        setTimeout(() => {
          setWsReconnectAttempts(prev => prev + 1);
          connectWebSocket();
        }, 3000 * (wsReconnectAttempts + 1));
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      addActivityLog('system', 'WebSocket error', 'error');
    };

    setWs(websocket);
  }, [projectId, wsReconnectAttempts]);

  useEffect(() => {
    if (projectId) {
      connectWebSocket();
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [projectId, connectWebSocket]);

  const updateAgentStatus = (agentId: string, state: any) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        const newStatus = state.status || agent.status;
        const newProgress = state.progress || agent.progress;
        const newTask = state.current_task || agent.current_task;

        addActivityLog(
          agent.name,
          `${newTask || 'Processing'}`,
          newStatus === 'error' ? 'error' : 'info'
        );

        return {
          ...agent,
          status: newStatus,
          progress: newProgress,
          current_task: newTask
        };
      }
      return agent;
    }));
  };

  const addActivityLog = (agent: string, action: string, status: 'info' | 'success' | 'error') => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      agent,
      action,
      status
    };

    setActivityLog(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit project');
      }

      setProjectId(data.id);
      setSubmitStatus('success');
      addActivityLog('system', 'Project submitted successfully', 'success');

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          budget: '',
          timeline: '',
          skills: '',
          location: '',
          experience_level: 'intermediate'
        });
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      addActivityLog('system', 'Failed to submit project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <motion.h1 
            className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            InstaBids
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Autonomous Agent-Powered Project Bidding System
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Send className="w-6 h-6 text-blue-400" />
                Submit New Project
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., E-commerce Website Development"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your project requirements..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium mb-2">
                      Budget ($)
                    </label>
                    <input
                      type="number"
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label htmlFor="timeline" className="block text-sm font-medium mb-2">
                      Timeline (days)
                    </label>
                    <input
                      type="number"
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="skills" className="block text-sm font-medium mb-2">
                    Required Skills
                  </label>
                  <input
                    type="text"
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="React, Node.js, PostgreSQL"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium mb-2">
                      Location Preference
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Remote"
                    />
                  </div>

                  <div>
                    <label htmlFor="experience_level" className="block text-sm font-medium mb-2">
                      Experience Level
                    </label>
                    <select
                      id="experience_level"
                      name="experience_level"
                      value={formData.experience_level}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="entry">Entry Level</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200",
                    "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Project
                    </>
                  )}
                </button>

                {/* Status Messages */}
                <AnimatePresence>
                  {submitStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded-lg"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-green-400">Project submitted successfully!</span>
                    </motion.div>
                  )}

                  {submitStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-red-400">{errorMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>

          {/* Agent Status Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Bot className="w-6 h-6 text-purple-400" />
                  Agent Status
                </h2>
                <div className="flex items-center gap-2">
                  {wsConnected ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <Wifi className="w-4 h-4" />
                      <span className="text-sm">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-400">
                      <WifiOff className="w-4 h-4" />
                      <span className="text-sm">Disconnected</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {agents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    className="bg-gray-700/50 rounded-lg p-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{agent.name}</h3>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        agent.status === 'idle' && "bg-gray-600/50 text-gray-300",
                        agent.status === 'active' && "bg-blue-500/20 text-blue-400",
                        agent.status === 'completed' && "bg-green-500/20 text-green-400",
                        agent.status === 'error' && "bg-red-500/20 text-red-400"
                      )}>
                        {agent.status}
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{agent.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${agent.progress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {agent.current_task && (
                      <p className="text-xs text-gray-400 italic">
                        {agent.current_task}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-yellow-400" />
                Activity Log
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                <AnimatePresence>
                  {activityLog.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-start gap-3 p-2 rounded-lg text-sm",
                        log.status === 'info' && "bg-blue-500/10",
                        log.status === 'success' && "bg-green-500/10",
                        log.status === 'error' && "bg-red-500/10"
                      )}
                    >
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {log.timestamp}
                      </span>
                      <span className={cn(
                        "font-medium",
                        log.status === 'info' && "text-blue-400",
                        log.status === 'success' && "text-green-400",
                        log.status === 'error' && "text-red-400"
                      )}>
                        {log.agent}:
                      </span>
                      <span className="text-gray-300 flex-1">
                        {log.action}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {activityLog.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No activity yet. Submit a project to see agent activity.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}