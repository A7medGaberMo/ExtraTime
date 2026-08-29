'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useI18n } from '@/lib/i18n';
import { AppIcon } from '@/components/ui/app-icon';
import {
  User,
  CheckCircle,
  Warning,
  FloppyDisk,
  ArrowLeft,
  PaintBrush,
  Shield,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { useToast } from '@/components/shared/toast';
import { useUser, SignInButton } from '@clerk/nextjs';
import {
  CHARACTER_PERSONAS,
  parseAvatarSeed,
  encodeClubAvatarSeed,
  getMonogramInitial,
} from '@/lib/avatars';

interface ViewerDoc {
  _id: string;
  displayName: string;
  username: string;
  avatarSeed: string;
}

function ProfileEditorForm({ viewer }: { viewer: ViewerDoc }) {
  const router = useRouter();
  const { t, isRTL, lang } = useI18n();
  const { toast } = useToast();
  const updateProfileMutation = useMutation(api.users.mutations.updateProfile);

  const [displayName, setDisplayName] = useState(viewer.displayName || '');
  const [username, setUsername] = useState(viewer.username || '');
  const initialSeed = viewer.avatarSeed || 'persona-tactician';
  const [avatarSeed, setAvatarSeed] = useState(initialSeed);
  const [avatarTab, setAvatarTab] = useState<'personas' | 'clubs'>(
    initialSeed.startsWith('club:') ? 'clubs' : 'personas',
  );
  const [clubSearch, setClubSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const clubs = useQuery(api.clubs.queries.searchClubs, { search: clubSearch });

  // Debounced username availability
  const [debouncedUsername, setDebouncedUsername] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUsername(username.trim().toLowerCase());
    }, 350);
    return () => clearTimeout(handler);
  }, [username]);

  const availability = useQuery(
    api.users.queries.checkUsernameAvailable,
    debouncedUsername && debouncedUsername.length >= 3 ? { username: debouncedUsername } : 'skip',
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!displayName.trim()) {
      setErrorMsg('Display name is required.');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Username is required.');
      return;
    }
    if (availability && !availability.available && !availability.isCurrent) {
      setErrorMsg(availability.reason || 'Username is not available.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileMutation({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        avatarSeed,
      });
      toast(t('profile.profileSaved') || 'Profile updated successfully!', 'success');
      router.push(`/profile/${username.trim().toLowerCase()}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const parsedAvatar = parseAvatarSeed(avatarSeed);
  const activeMeta = parsedAvatar.meta;
  const monogram = getMonogramInitial(displayName || 'Manager', 2);

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="btn-haptic mb-5 flex items-center gap-2 text-sm text-steel hover:text-white transition-colors cursor-pointer"
      >
        <AppIcon icon={ArrowLeft} size={16} weight="bold" className={isRTL ? 'rotate-180' : ''} />
        <span>{t('common.back')}</span>
      </button>

      {/* Live Profile Preview Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${activeMeta.gradient} border ${activeMeta.border} font-black text-xl font-stats ${activeMeta.text} ${activeMeta.glow} transition-all p-1.5 overflow-hidden`}
          >
            {parsedAvatar.avatarUrl ? (
              <div className="relative h-full w-full flex items-center justify-center">
                <Image
                  src={parsedAvatar.avatarUrl}
                  alt={displayName || 'Avatar'}
                  width={56}
                  height={56}
                  className="max-h-full max-w-full object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <span>{monogram}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-white font-stats">
              {displayName || 'Manager'}
            </h2>
            <p className="truncate text-xs text-lime font-stats font-semibold mt-0.5">
              @{username || 'manager_handle'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime/10 border border-lime/30 text-lime">
            <AppIcon icon={User} size={20} weight="bold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-stats">
              {t('profile.editProfile')}
            </h1>
            <p className="text-xs text-steel">
              {lang === 'ar' ? 'تخصيص الهوية والشعار التكتيكي' : 'Customize identity & tactical avatar'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300">
            <AppIcon icon={Warning} size={16} weight="bold" className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Mode Tabs: Personas vs Clubs vs Minimal */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-steel font-stats uppercase tracking-wider">
                <AppIcon icon={PaintBrush} size={14} weight="bold" className="text-lime" />
                <span>{t('profile.avatar') || 'Avatar'}</span>
              </label>

              {/* Toggle Pills: Tactical Badges vs Official Clubs */}
              <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setAvatarTab('personas')}
                  className={`btn-haptic flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold font-stats transition-all cursor-pointer ${
                    avatarTab === 'personas'
                      ? 'bg-lime text-slate-950 shadow-glow-lime'
                      : 'text-steel hover:text-white'
                  }`}
                >
                  <AppIcon icon={PaintBrush} size={14} weight="bold" />
                  <span>{lang === 'ar' ? 'شارات تكتيكية' : 'Tactical'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('clubs')}
                  className={`btn-haptic flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold font-stats transition-all cursor-pointer ${
                    avatarTab === 'clubs'
                      ? 'bg-lime text-slate-950 shadow-glow-lime'
                      : 'text-steel hover:text-white'
                  }`}
                >
                  <AppIcon icon={Shield} size={14} weight="bold" />
                  <span>{lang === 'ar' ? 'شعار النادي' : 'Club Crest'}</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Illustrated Character Personas */}
            {avatarTab === 'personas' && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {CHARACTER_PERSONAS.map((persona) => {
                  const isSelected = avatarSeed === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setAvatarSeed(persona.id)}
                      title={lang === 'ar' ? persona.nameAr : persona.nameEn}
                      className={`btn-haptic group relative flex flex-col items-center justify-center rounded-2xl border p-1.5 transition-all cursor-pointer aspect-square ${isSelected
                          ? 'border-lime bg-lime/15 ring-2 ring-lime ring-offset-2 ring-offset-slate-950 scale-105 shadow-glow-lime'
                          : 'border-white/10 bg-slate-900/80 hover:border-white/25 hover:scale-105'
                        }`}
                    >
                      <div className="relative h-full w-full flex items-center justify-center overflow-hidden rounded-xl">
                        <Image
                          src={persona.avatarUrl}
                          alt={persona.nameEn}
                          width={44}
                          height={44}
                          className="max-h-full max-w-full object-contain transition-transform group-hover:scale-110"
                          unoptimized
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB 2: Official Club Crests */}
            {avatarTab === 'clubs' && (
              <div className="space-y-3">
                <div className="relative">
                  <AppIcon
                    icon={MagnifyingGlass}
                    size={15}
                    weight="bold"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-steel"
                  />
                  <input
                    type="text"
                    value={clubSearch}
                    onChange={(e) => setClubSearch(e.target.value)}
                    placeholder={lang === 'ar' ? 'ابحث عن ناديك (ريال مدريد، آرسنال، الأهلي...)' : 'Search club (Real Madrid, Arsenal, Al Ahly...)'}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/90 pl-9 pr-4 py-2 text-xs text-white placeholder-steel/50 focus:border-lime focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                  {clubs && clubs.length > 0 ? (
                    clubs.map((club) => {
                      const encoded = encodeClubAvatarSeed(club.name, club.logo);
                      const isSelected = avatarSeed === encoded || avatarSeed.startsWith(`club:${club.name}`);
                      return (
                        <button
                          key={club._id}
                          type="button"
                          onClick={() => setAvatarSeed(encoded)}
                          title={club.name}
                          className={`btn-haptic relative flex items-center justify-center rounded-2xl border p-2 text-center transition-all cursor-pointer aspect-square ${isSelected
                              ? 'border-lime bg-lime/15 ring-2 ring-lime ring-offset-2 ring-offset-slate-950 scale-105 shadow-glow-lime'
                              : 'border-white/10 bg-slate-900/80 hover:border-white/20 hover:scale-105'
                            }`}
                        >
                          {club.logo ? (
                            <Image
                              src={club.logo}
                              alt={club.name}
                              width={32}
                              height={32}
                              className="max-h-full max-w-full object-contain"
                              unoptimized
                            />
                          ) : (
                            <AppIcon icon={Shield} size={20} weight="duotone" className="text-lime" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-6 text-center text-xs text-steel">
                      {lang === 'ar' ? 'لم يتم العثور على أندية مطابقة' : 'No matching clubs found'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-steel font-stats uppercase tracking-wider">
              {t('profile.displayName')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={24}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-steel/40 focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime transition-all"
              placeholder="e.g. Master Tactician"
            />
          </div>

          {/* Username / Handle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-steel font-stats uppercase tracking-wider">
                {t('profile.username')}
              </label>
              {availability && debouncedUsername.length >= 3 && (
                <span
                  className={`flex items-center gap-1 text-[11px] font-semibold font-stats ${availability.available ? 'text-lime' : 'text-rose-400'
                    }`}
                >
                  {availability.available ? (
                    <>
                      <AppIcon icon={CheckCircle} size={13} weight="bold" />
                      <span>{t('profile.usernameAvailable')}</span>
                    </>
                  ) : (
                    <>
                      <AppIcon icon={Warning} size={13} weight="bold" />
                      <span>{availability.reason || t('profile.usernameTaken')}</span>
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-steel text-sm font-stats">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={15}
                required
                className="w-full rounded-2xl border border-white/10 bg-slate-900/90 pl-8 pr-4 py-3 text-sm text-white placeholder-steel/40 font-stats focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime transition-all"
                placeholder="manager_handle"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-steel">
              3-15 characters (lowercase letters, numbers, underscores).
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-haptic flex w-full items-center justify-center gap-2 rounded-2xl bg-lime py-3.5 text-sm font-bold text-slate-950 hover:bg-lime/90 transition-all shadow-glow-lime disabled:opacity-50 cursor-pointer font-stats"
          >
            <AppIcon icon={FloppyDisk} size={18} weight="bold" />
            <span>{isSaving ? t('profile.saving') : t('profile.saveChanges')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfileSettingsPage() {
  const { t, lang } = useI18n();
  const { isLoaded, isSignedIn } = useUser();
  const viewer = useQuery(api.users.queries.viewer);

  if (!isLoaded || (isSignedIn && viewer === undefined)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn || !viewer) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-steel">
          <AppIcon icon={User} size={32} weight="bold" />
        </div>
        <h1 className="text-xl font-bold text-white font-stats mb-2">
          {lang === 'ar' ? 'تسجيل الدخول مطلوب' : 'Authentication Required'}
        </h1>
        <p className="text-xs text-steel mb-6">
          {lang === 'ar'
            ? 'يرجى تسجيل الدخول لتعديل هويتك وبيانات ملفك الشخصي.'
            : 'Please sign in to customize your profile and tactical identity.'}
        </p>
        <SignInButton mode="modal">
          <button
            type="button"
            className="btn-haptic inline-flex items-center gap-2 rounded-2xl bg-lime px-6 py-2.5 text-xs font-bold text-slate-950 font-stats shadow-glow-lime cursor-pointer"
          >
            <span>{t('auth.signIn')}</span>
          </button>
        </SignInButton>
      </div>
    );
  }

  return <ProfileEditorForm key={viewer._id} viewer={viewer as ViewerDoc} />;
}

