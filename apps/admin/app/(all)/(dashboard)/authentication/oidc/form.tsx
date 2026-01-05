import { useState } from "react";
import { isEmpty } from "lodash-es";
import Link from "next/link";
import { useForm } from "react-hook-form";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast, setPromiseToast } from "@plane/propel/toast";
import type {
  IFormattedInstanceConfiguration,
  TInstanceOIDCAuthenticationConfigurationKeys,
  TInstanceConfigurationKeys,
} from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// components
import { CodeBlock } from "@/components/common/code-block";
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
import type { TCopyField } from "@/components/common/copy-field";
import { CopyField } from "@/components/common/copy-field";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type OIDCConfigFormValues = Record<TInstanceOIDCAuthenticationConfigurationKeys, string>;

export function InstanceOIDCConfigForm(props: Props) {
  const { config } = props;
  // states
  const [isDiscardChangesModalOpen, setIsDiscardChangesModalOpen] = useState(false);
  const [isSubmittingAuto, setIsSubmittingAuto] = useState(false);
  // store hooks
  const { formattedConfig, updateInstanceConfigurations } = useInstance();
  // form data
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<OIDCConfigFormValues>({
    defaultValues: {
      OIDC_CLIENT_ID: config["OIDC_CLIENT_ID"],
      OIDC_CLIENT_SECRET: config["OIDC_CLIENT_SECRET"],
      OIDC_URL_AUTHORIZATION: config["OIDC_URL_AUTHORIZATION"],
      OIDC_URL_TOKEN: config["OIDC_URL_TOKEN"],
      OIDC_URL_USERINFO: config["OIDC_URL_USERINFO"],
      OIDC_URL_ENDSESSION: config["OIDC_URL_ENDSESSION"],
    },
  });

  const updateConfig = async (key: TInstanceConfigurationKeys, value: string) => {
    setIsSubmittingAuto(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving configuration",
      success: {
        title: "Success",
        message: () => "Configuration saved successfully",
      },
      error: {
        title: "Error",
        message: () => "Failed to save configuration",
      },
    });

    await updateConfigPromise
      .then(() => {
        setIsSubmittingAuto(false);
      })
      .catch((err) => {
        console.error(err);
        setIsSubmittingAuto(false);
      });
  };

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const OIDC_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "OIDC_URL_AUTHORIZATION",
      type: "text",
      label: "Authorization Endpoint",
      description: (
        <>
          Example: https://idp.your-company.com/o/authorize/. This is the URL where users will be redirected to
          authenticate.
        </>
      ),
      placeholder: "https://idp.your-company.com/o/authorize/",
      error: Boolean(errors.OIDC_URL_AUTHORIZATION),
      required: true,
    },
    {
      key: "OIDC_URL_TOKEN",
      type: "text",
      label: "Token Endpoint",
      description: (
        <>
          Example: https://idp.your-company.com/o/token/. This is the URL where we will exchange the code for an access
          token.
        </>
      ),
      placeholder: "https://idp.your-company.com/o/token/",
      error: Boolean(errors.OIDC_URL_TOKEN),
      required: true,
    },
    {
      key: "OIDC_URL_USERINFO",
      type: "text",
      label: "UserInfo Endpoint",
      description: (
        <>Example: https://idp.your-company.com/o/userinfo/. This is the URL where we will get user information.</>
      ),
      placeholder: "https://idp.your-company.com/o/userinfo/",
      error: Boolean(errors.OIDC_URL_USERINFO),
      required: true,
    },
    {
      key: "OIDC_URL_ENDSESSION",
      type: "text",
      label: "End Session Endpoint (Optional)",
      description: (
        <>Example: https://idp.your-company.com/o/logout/. This is the URL where we will end the user session.</>
      ),
      placeholder: "https://idp.your-company.com/o/logout/",
      error: Boolean(errors.OIDC_URL_ENDSESSION),
      required: false,
    },
    {
      key: "OIDC_CLIENT_ID",
      type: "text",
      label: "Client ID",
      description: <>Get this from your OpenID Connect Provider.</>,
      placeholder: "your-client-id",
      error: Boolean(errors.OIDC_CLIENT_ID),
      required: true,
    },
    {
      key: "OIDC_CLIENT_SECRET",
      type: "password",
      label: "Client Secret",
      description: <>Get this from your OpenID Connect Provider as well.</>,
      placeholder: "your-client-secret",
      error: Boolean(errors.OIDC_CLIENT_SECRET),
      required: true,
    },
  ];

  const OIDC_SERVICE_FIELD: TCopyField[] = [
    {
      key: "Callback_URL",
      label: "Callback URL",
      url: `${originURL}/auth/oidc/callback/`,
      description: (
        <>
          We will auto-generate this. Paste this into the <CodeBlock darkerShade>Redirect URI</CodeBlock> field of your
          OpenID Connect Provider.
        </>
      ),
    },
  ];

  const onSubmit = async (formData: OIDCConfigFormValues) => {
    const payload: Partial<OIDCConfigFormValues> = { ...formData };

    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: "Your OpenID Connect authentication is configured. You should test it now.",
      });
      reset({
        OIDC_CLIENT_ID: response.find((item) => item.key === "OIDC_CLIENT_ID")?.value,
        OIDC_CLIENT_SECRET: response.find((item) => item.key === "OIDC_CLIENT_SECRET")?.value,
        OIDC_URL_AUTHORIZATION: response.find((item) => item.key === "OIDC_URL_AUTHORIZATION")?.value,
        OIDC_URL_TOKEN: response.find((item) => item.key === "OIDC_URL_TOKEN")?.value,
        OIDC_URL_USERINFO: response.find((item) => item.key === "OIDC_URL_USERINFO")?.value,
        OIDC_URL_ENDSESSION: response.find((item) => item.key === "OIDC_URL_ENDSESSION")?.value,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoBack = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (isDirty) {
      e.preventDefault();
      setIsDiscardChangesModalOpen(true);
    }
  };

  const automaticOIDCRedirect = formattedConfig?.IS_OIDC_AUTO ?? "";

  return (
    <>
      <ConfirmDiscardModal
        isOpen={isDiscardChangesModalOpen}
        onDiscardHref="/authentication"
        handleClose={() => setIsDiscardChangesModalOpen(false)}
      />
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 w-full">
          <div className="flex flex-col gap-y-4 col-span-2 md:col-span-1 pt-1">
            <div className="pt-2.5 text-18 font-medium">OIDC Provider details for Plane</div>
            {OIDC_FORM_FIELDS.map((field) => (
              <ControllerInput
                key={field.key}
                control={control}
                type={field.type}
                name={field.key}
                label={field.label}
                description={field.description}
                placeholder={field.placeholder}
                error={field.error}
                required={field.required}
              />
            ))}
            <div className="flex flex-col gap-1 pt-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={(e) => void handleSubmit(onSubmit)(e)}
                  loading={isSubmitting}
                  disabled={!isDirty}
                >
                  {isSubmitting ? "Saving" : "Save changes"}
                </Button>
                <Link href="/authentication" className={getButtonStyling("secondary", "lg")} onClick={handleGoBack}>
                  Go back
                </Link>
              </div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-col gap-y-4 px-6 pt-1.5 pb-4 bg-layer-3 rounded-lg">
              <div className="pt-2 text-18 font-medium">Plane-provided details for OpenID Connect</div>
              {OIDC_SERVICE_FIELD.map((field) => (
                <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
              ))}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-14 font-medium">Automatic OIDC Redirect</div>
                  <div className="text-12 text-tertiary">
                    Automatically redirect users to the OIDC provider. Only enable after testing!
                  </div>
                </div>
                <ToggleSwitch
                  value={Boolean(parseInt(automaticOIDCRedirect))}
                  onChange={() => {
                    const newValue = Boolean(parseInt(automaticOIDCRedirect)) === true ? "0" : "1";
                    updateConfig("IS_OIDC_AUTO", newValue);
                  }}
                  size="sm"
                  disabled={isSubmittingAuto}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
