'use client';
import * as React from 'react';
import { T } from '@/lib/testing/testIds';

type VotingMethod = 'single' | 'approval' | 'ranked' | 'range' | 'quadratic' | '';

export default function PollCreatePage() {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [votingMethod, setVotingMethod] = React.useState<VotingMethod>('');
  const [privacyLevel, setPrivacyLevel] = React.useState<'public'|'private'>('public');
  const [startTime, setStartTime] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [endTime, setEndTime] = React.useState<string>('');
  const [options, setOptions] = React.useState<string[]>(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [createdPollId, setCreatedPollId] = React.useState<string>('');

  const [errors, setErrors] = React.useState<{
    title?: string; 
    votingMethod?: string; 
    options?: string; 
    timing?: string;
    general?: string;
  }>({});

  function addOption() {
    setOptions((o) => [...o, '']);
  }

  function removeOption(i: number) {
    setOptions((o) => o.filter((_, idx) => idx !== i));
  }

  function updateOption(i: number, value: string) {
    setOptions((o) => o.map((v, idx) => (idx === i ? value : v)));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!votingMethod) e.votingMethod = 'Voting method is required';
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (filled.length < 2) e.options = 'At least 2 options are required';
    if (startTime && endTime && new Date(startTime) >= new Date(`${endDate}T${endTime}`)) {
      e.timing = 'End time must be after start time';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      // Create poll via API
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          options: options.filter(opt => opt.trim()),
          votingMethod,
          category,
          privacyLevel,
          endTime: endDate && endTime ? `${endDate}T${endTime}` : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      const poll = await response.json();
      setCreatedPollId(poll.id);
      setSuccess(true);
      
      // Redirect to the poll page after a short delay
      setTimeout(() => {
        window.location.href = `/polls/${poll.id}`;
      }, 2000);
    } catch (error) {
      console.error('Poll creation failed:', error);
      setErrors({ ...errors, general: 'Failed to create poll. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function onReset() {
    setTitle('');
    setDescription('');
    setCategory('');
    setVotingMethod('');
    setPrivacyLevel('public');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setOptions(['', '', '', '']);
    setErrors({});
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Poll Created Successfully!</h2>
          <p className="text-gray-600 mb-4" data-testid="poll-created-success">
            Your poll has been created and is now live.
          </p>
          
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Poll ID:</span> 
              <span data-testid="poll-id" className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {createdPollId}
              </span>
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Title:</span> 
              <span data-testid="poll-title-display" className="ml-2">{title}</span>
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Voting Method:</span> 
              <span data-testid="voting-method-display" className="ml-2">
                {votingMethod === 'single' ? 'Single Choice' :
                 votingMethod === 'approval' ? 'Approval Voting' :
                 votingMethod === 'ranked' ? 'Ranked Choice' :
                 votingMethod === 'range' ? 'Range Voting' :
                 votingMethod === 'quadratic' ? 'Quadratic Voting' : votingMethod}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Poll</h1>
        
        <form onSubmit={onSubmit} className="space-y-6" data-testid="poll-creation-form">
          <div>
            <label className="block mb-1">Title</label>
            <input
              data-testid={T.pollCreate.title}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.title && (
              <p data-testid={T.pollCreate.titleError} className="text-red-600 text-sm">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Description</label>
            <textarea
              data-testid={T.pollCreate.description}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          <div>
            <label className="block mb-1">Category</label>
            <select
              data-testid={T.pollCreate.category}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a category</option>
              <option value="general">General</option>
              <option value="politics">Politics</option>
              <option value="technology">Technology</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Voting method</label>
            <select
              data-testid={T.pollCreate.votingMethod}
              value={votingMethod}
              onChange={(e) => setVotingMethod(e.target.value as VotingMethod)}
              className="select w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select voting method</option>
              <option value="single">Single Choice</option>
              <option value="approval">Approval Voting</option>
              <option value="ranked">Ranked Choice</option>
              <option value="range">Range Voting</option>
              <option value="quadratic">Quadratic Voting</option>
            </select>
            {errors.votingMethod && (
              <p data-testid={T.pollCreate.votingMethodError} className="text-red-600 text-sm">
                {errors.votingMethod}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block">Options</label>
            {options.map((val, idx) => {
              const humanIndex = idx + 1;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    data-testid={T.pollCreate.optionInput(humanIndex)}
                    value={val}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    className="input flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={`Option ${humanIndex}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      data-testid={T.pollCreate.removeOption(humanIndex)}
                      onClick={() => removeOption(idx)}
                      className="btn btn-secondary px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              data-testid={T.pollCreate.addOption}
              onClick={addOption}
              className="btn px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add option
            </button>
            {errors.options && (
              <p data-testid={T.pollCreate.optionsError} className="text-red-600 text-sm">
                {errors.options}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Start Time</label>
              <input
                type="datetime-local"
                data-testid={T.pollCreate.startTime}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block mb-1">End Date</label>
              <input
                type="date"
                data-testid="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div>
            <label className="block mb-1">End Time</label>
            <input
              type="time"
              data-testid={T.pollCreate.endTime}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {errors.timing && (
            <p data-testid={T.pollCreate.timingError} className="text-red-600 text-sm">
              {errors.timing}
            </p>
          )}

          {errors.general && (
            <p className="text-red-600 text-sm">
              {errors.general}
            </p>
          )}

          <div>
            <label className="block mb-1">Privacy Level</label>
            <select
              data-testid={T.pollCreate.privacyLevel}
              value={privacyLevel}
              onChange={(e) => setPrivacyLevel(e.target.value as 'public'|'private')}
              className="select w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              data-testid={T.pollCreate.submit} 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create poll'}
            </button>
            <button 
              data-testid={T.pollCreate.reset} 
              type="button" 
              onClick={onReset}
              className="btn btn-secondary px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
