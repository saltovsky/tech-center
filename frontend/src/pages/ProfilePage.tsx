import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api, { errorMessage, setSession } from "../api/client";
import { Alert } from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";
import { localizeApiMessage, useLanguage } from "../contexts/LanguageContext";
import { useRouter } from "../router";

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm: string;
};

export function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z
        .object({
          current_password: z.string().min(8, t("common.min8")),
          new_password: z.string().min(12, t("common.min12")),
          confirm: z.string(),
        })
        .refine((value) => value.new_password === value.confirm, {
          message: t("profile.passwordMismatch"),
          path: ["confirm"],
        }),
    [t],
  );
  const form = useForm<PasswordForm>({
    resolver: zodResolver(schema),
  });
  const passwordFields: Array<{
    name: keyof PasswordForm;
    label: string;
    autoComplete: string;
  }> = [
    {
      name: "current_password",
      label: t("profile.currentPassword"),
      autoComplete: "current-password",
    },
    {
      name: "new_password",
      label: t("profile.newPassword"),
      autoComplete: "new-password",
    },
    {
      name: "confirm",
      label: t("profile.repeatPassword"),
      autoComplete: "new-password",
    },
  ];

  const changePassword = async (data: PasswordForm) => {
    setError(null);
    try {
      const response = await api.post<{ detail: string }>("/auth/change-password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      setSession(null);
      window.alert(localizeApiMessage(response.data.detail));
      navigate("/login", true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <div className="mb-4">
        <span className="page-kicker">{t("profile.kicker")}</span>
        <h1 className="h3 mt-2 mb-2">{t("profile.title")}</h1>
        <p className="text-body-secondary mb-0">{t("profile.description")}</p>
      </div>

      <Alert message={error} onClose={() => setError(null)} />

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <section className="card shadow-sm h-100">
            <div className="card-header bg-body fw-semibold">{t("profile.account")}</div>
            <div className="card-body d-flex align-items-center gap-3">
              <span className="profile-avatar" aria-hidden="true">
                {user?.email.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="text-body-secondary small">{t("profile.adminEmail")}</div>
                <strong className="d-block text-break">{user?.email}</strong>
              </div>
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-8">
          <section className="card shadow-sm">
            <div className="card-header bg-body fw-semibold">{t("profile.changePassword")}</div>
            <div className="card-body">
              <form
                className="profile-password-form"
                onSubmit={(event) => void form.handleSubmit(changePassword)(event)}
              >
                {passwordFields.map((field) => (
                  <div className="mb-3" key={field.name}>
                    <label className="form-label" htmlFor={field.name}>
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      type="password"
                      autoComplete={field.autoComplete}
                      className={`form-control ${form.formState.errors[field.name] ? "is-invalid" : ""}`}
                      {...form.register(field.name)}
                    />
                    <div className="invalid-feedback">
                      {form.formState.errors[field.name]?.message}
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-primary"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  {t("profile.submitPassword")}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
