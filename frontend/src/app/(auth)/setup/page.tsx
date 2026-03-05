"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { useAuthStore } from "@/stores/authStore"
import { authApi } from "@/lib/api/auth"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  UserCircle,
  KeyRound,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SetupForm {
  company_name: string
  first_name: string
  last_name: string
  email: string
  password: string
}

const steps = [
  { id: "company", title: "Your Company", icon: Building2, description: "Let's start with your company details" },
  { id: "profile", title: "Admin Profile", icon: UserCircle, description: "Create your administrator account" },
  { id: "security", title: "Secure Access", icon: KeyRound, description: "Set up your login credentials" },
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)
  const [setupComplete, setSetupComplete] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<SetupForm>({ mode: "onChange" })

  useEffect(() => {
    authApi
      .setupCheck()
      .then((res) => {
        if (!res.needs_setup) {
          router.replace("/login")
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [router])

  const nextStep = useCallback(async () => {
    let valid = false
    if (step === 0) valid = await trigger("company_name")
    else if (step === 1) valid = await trigger(["first_name"])
    else valid = await trigger(["email", "password"])
    if (valid) {
      setDirection(1)
      setError(null)
      setStep((s) => Math.min(s + 1, steps.length - 1))
    }
  }, [step, trigger])

  const prevStep = useCallback(() => {
    setDirection(-1)
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const onSubmit = async (data: SetupForm) => {
    setError(null)
    setIsSubmitting(true)
    try {
      const response = await authApi.setup(data)
      const { setAuthTokens, fetchUser } = useAuthStore.getState()
      setAuthTokens(response.access, response.refresh)
      setSetupComplete(true)
      await fetchUser()
      setTimeout(() => router.push("/leads"), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-muted-foreground" />
        </motion.div>
      </div>
    )
  }

  if (setupComplete) {
    return (
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
          >
            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold tracking-tight">You&apos;re all set!</h2>
            <p className="mt-2 text-muted-foreground">
              Redirecting to your dashboard...
            </p>
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 1.2, ease: "easeInOut" }}
            className="h-1 w-48 origin-left rounded-full bg-green-500"
          />
        </motion.div>
      </div>
    )
  }

  const StepIcon = steps[step].icon

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[440px]">
      {/* Mobile logo */}
      <div className="flex items-center justify-center lg:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-6 w-6"
        >
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
        <span className="text-lg font-medium">Precept CRM</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: i === step ? 1 : 0.85,
                backgroundColor: i <= step
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted))",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium"
            >
              {i < step ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Check className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              ) : (
                <span className={i <= step ? "text-primary-foreground" : "text-muted-foreground"}>
                  {i + 1}
                </span>
              )}
            </motion.div>
            {i < steps.length - 1 && (
              <div className="relative h-0.5 w-8 overflow-hidden rounded-full bg-muted">
                <motion.div
                  animate={{ scaleX: i < step ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 origin-left bg-primary"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Header with icon */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"
          >
            <StepIcon className="h-7 w-7 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {steps[step].title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {steps[step].description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Company */}
            {step === 0 && (
              <motion.div
                key="company"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="grid gap-4"
              >
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    placeholder="Acme Inc."
                    autoFocus
                    className="h-12 text-base"
                    disabled={isSubmitting}
                    {...register("company_name", {
                      required: "Company name is required",
                    })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); nextStep() } }}
                  />
                  {errors.company_name && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive"
                    >
                      {errors.company_name.message}
                    </motion.p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be the name of your workspace in Precept CRM
                </p>
              </motion.div>
            )}

            {/* Step 2: Profile */}
            {step === 1 && (
              <motion.div
                key="profile"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="grid gap-4"
              >
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      placeholder="John"
                      autoFocus
                      className="h-12 text-base"
                      disabled={isSubmitting}
                      {...register("first_name", {
                        required: "First name is required",
                      })}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); nextStep() } }}
                    />
                    {errors.first_name && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive"
                      >
                        {errors.first_name.message}
                      </motion.p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      placeholder="Doe"
                      className="h-12 text-base"
                      disabled={isSubmitting}
                      {...register("last_name")}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); nextStep() } }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll be the super administrator with full access
                </p>
              </motion.div>
            )}

            {/* Step 3: Security */}
            {step === 2 && (
              <motion.div
                key="security"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="grid gap-4"
              >
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@yourcompany.com"
                    autoFocus
                    className="h-12 text-base"
                    disabled={isSubmitting}
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    className="h-12 text-base"
                    disabled={isSubmitting}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                  />
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <motion.div
          layout
          className="mt-6 flex items-center gap-3"
        >
          {step > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
                className="h-12 px-5"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </motion.div>
          )}

          {step < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="h-12 flex-1"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Launch Precept
                </>
              )}
            </Button>
          )}
        </motion.div>
      </form>
    </div>
  )
}
