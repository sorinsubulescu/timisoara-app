'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  User,
  Mail,
  Ticket,
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { createEvent, type CreateEventPayload } from '@/lib/api';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'theater', label: 'Theater', emoji: '🎭' },
  { value: 'art', label: 'Art', emoji: '🎨' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'food', label: 'Food', emoji: '🍽️' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'festival', label: 'Festival', emoji: '🎪' },
  { value: 'meetup', label: 'Meetup', emoji: '🤝' },
  { value: 'free', label: 'Free', emoji: '🆓' },
  { value: 'other', label: 'Other', emoji: '📌' },
];

const inputClass =
  'rounded-xl border border-white/40 bg-white/70 px-3.5 py-2.5 text-sm shadow-glass outline-none backdrop-blur-xl transition-all focus:border-primary-300 focus:bg-white focus:shadow-glow-primary focus:ring-2 focus:ring-primary-400/20';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function SubmitEventPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState('submitting');
    setErrorMsg('');

    const payload: CreateEventPayload = {
      title: title.trim(),
      description: description.trim(),
      category,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      venue: venue.trim(),
      venueAddress: venueAddress.trim(),
      isFree,
      price: isFree ? undefined : price.trim() || undefined,
      ticketUrl: ticketUrl.trim() || undefined,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      submitterName: submitterName.trim(),
      submitterEmail: submitterEmail.trim(),
    };

    try {
      await createEvent(payload);
      setFormState('success');
    } catch (err) {
      setFormState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (formState === 'success') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-50">
          <CheckCircle2 className="h-10 w-10 text-accent-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Event Submitted!</h1>
        <p className="max-w-sm text-gray-400">
          Your event has been added to the community calendar.
          Mulțumim for contributing to Timișoara!
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setFormState('idle');
              setTitle('');
              setDescription('');
              setCategory('');
              setStartDate('');
              setEndDate('');
              setVenue('');
              setVenueAddress('');
              setIsFree(true);
              setPrice('');
              setTicketUrl('');
              setTagsInput('');
            }}
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-warm-50"
          >
            Submit Another
          </button>
          <Link
            href="/events"
            className="rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 transition hover:brightness-105"
          >
            View Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-4 animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/events"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 backdrop-blur-lg transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Submit an Event</h1>
      </div>

      <p className="mb-6 text-sm text-gray-400">
        Share an event happening in Timișoara with the community. Fill in the details below and it will appear on the events page.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* About You */}
        <fieldset className="glass rounded-2xl p-5">
          <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-500">
              <User className="h-3.5 w-3.5 text-white" />
            </span>
            About You
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-400">Your Name *</span>
              <input
                type="text"
                required
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="Maria Ionescu"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                <Mail className="h-3 w-3" /> Email *
              </span>
              <input
                type="email"
                required
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
                placeholder="maria@example.com"
                className={inputClass}
              />
            </label>
          </div>
        </fieldset>

        {/* Event Details */}
        <fieldset className="glass rounded-2xl p-5">
          <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </span>
            Event Details
          </legend>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-400">Title *</span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summer Jazz Concert at Roses Park"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-400">Description *</span>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people what this event is about..."
                className={inputClass}
              />
            </label>

            <div>
              <span className="mb-2 block text-xs font-semibold text-gray-400">Category *</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200',
                      category === cat.value
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/20'
                        : 'border border-white/40 bg-white/60 text-gray-600 backdrop-blur-lg hover:bg-white/90',
                    )}
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
              {!category && (
                <input tabIndex={-1} required value={category} onChange={() => {}} className="h-0 w-0 opacity-0" />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400">Start Date & Time *</span>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400">End Date & Time</span>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        </fieldset>

        {/* Location */}
        <fieldset className="glass rounded-2xl p-5">
          <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500">
              <MapPin className="h-3.5 w-3.5 text-white" />
            </span>
            Location
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-400">Venue Name *</span>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Parcul Rozelor"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-400">Address *</span>
              <input
                type="text"
                required
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="Bulevardul Cetății, Timișoara"
                className={inputClass}
              />
            </label>
          </div>
        </fieldset>

        {/* Tickets & Pricing */}
        <fieldset className="glass rounded-2xl p-5">
          <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500">
              <Ticket className="h-3.5 w-3.5 text-white" />
            </span>
            Tickets & Pricing
          </legend>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFree(true)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                  isFree
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-sm'
                    : 'border border-white/40 bg-white/60 text-gray-600 backdrop-blur-lg hover:bg-white/90',
                )}
              >
                Free Event
              </button>
              <button
                type="button"
                onClick={() => setIsFree(false)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                  !isFree
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
                    : 'border border-white/40 bg-white/60 text-gray-600 backdrop-blur-lg hover:bg-white/90',
                )}
              >
                Paid Event
              </button>
            </div>

            {!isFree && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-gray-400">Price</span>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="50 RON"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                    <LinkIcon className="h-3 w-3" /> Ticket Link
                  </span>
                  <input
                    type="url"
                    value={ticketUrl}
                    onChange={(e) => setTicketUrl(e.target.value)}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </label>
              </div>
            )}
          </div>
        </fieldset>

        {/* Tags */}
        <fieldset className="glass rounded-2xl p-5">
          <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500">
              <Tag className="h-3.5 w-3.5 text-white" />
            </span>
            Tags
          </legend>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-400">Comma-separated tags</span>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="jazz, outdoor, live music, summer"
              className={inputClass}
            />
          </label>
          {tagsInput && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagsInput.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                <span key={tag} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </fieldset>

        {formState === 'error' && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800">Submission failed</p>
              <p className="text-xs text-red-600">{errorMsg}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={formState === 'submitting'}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-primary-500/20 transition-all hover:shadow-lg hover:brightness-105 disabled:opacity-50"
        >
          {formState === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Event'
          )}
        </button>
      </form>
    </div>
  );
}
