import React from "react";
import { Link, useNavigate } from "react-router";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Checkbox,
  Typography,
  Card,
  Alert,
  Divider,
  Progress,
} from "antd";

import "../auth.css";
import { authService } from "../auth.service";

const { Title, Text } = Typography;

type Step = "form" | "otp" | "userid" | "success";

export default function Register() {
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();

  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState("");

  const navigate = useNavigate();

  const [step, setStep] = React.useState<Step>("form");

  const [registeredUser, setRegisteredUser] = React.useState<{
    id: string;
    userCode: string;
    email?: string;
    phoneNumber?: string;
  } | null>(null);

  const [otpResendTimer, setOtpResendTimer] = React.useState(0);

  // Password state
  const [password, setPassword] = React.useState("");

  // User ID state
  const [customUserCode, setCustomUserCode] = React.useState("");

  const [userCodeStatus, setUserCodeStatus] = React.useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  const [userCodeSaving, setUserCodeSaving] = React.useState(false);

  const debounceRef =
    React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─────────────────────────────────────
  // PASSWORD STRENGTH
  // ─────────────────────────────────────
  const getPasswordStrength = (password: string) => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return {
        percent: 25,
        status: "exception" as const,
        text: "Weak",
        color: "#ff4d4f",
      };
    }

    if (score === 3 || score === 4) {
      return {
        percent: 65,
        status: "active" as const,
        text: "Medium",
        color: "#faad14",
      };
    }

    return {
      percent: 100,
      status: "success" as const,
      text: "Strong",
      color: "#52c41a",
    };
  };

  const passwordStrength = getPasswordStrength(password);

  // ─────────────────────────────────────
  // OTP TIMER
  // ─────────────────────────────────────
  React.useEffect(() => {
    if (otpResendTimer <= 0) return;

    const t = setTimeout(() => {
      setOtpResendTimer((s) => s - 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [otpResendTimer]);

  // ─────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────
  const onFinish = async (values: any) => {
    setLoading(true);
    setApiError("");

    try {
      const { phone, confirmPassword, agree, ...rest } =
        values;

      const user = await authService.register({
        ...rest,
        phoneNumber: phone,
      });

      setRegisteredUser(user);

      setCustomUserCode(user.userCode);

      setUserCodeStatus("idle");

      setOtpResendTimer(60);

      setStep("otp");
    } catch (err: any) {
      setApiError(
        err.response?.data?.message ||
        "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────
  // VERIFY OTP
  // ─────────────────────────────────────
  const onVerifyOtp = async (values: any) => {
    if (!registeredUser) return;

    setLoading(true);
    setApiError("");

    try {
      await authService.verifyOTP({
        userId: registeredUser.id,
        otp: values.otp,
        type: registeredUser.email
          ? "EMAIL_VERIFICATION"
          : "PHONE_VERIFICATION",
      });

      setStep("userid");
    } catch (err: any) {
      setApiError(
        err.response?.data?.message ||
        "Invalid or expired OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────
  // RESEND OTP
  // ─────────────────────────────────────
  const onResendOtp = async () => {
    if ((!registeredUser?.email && !registeredUser?.phoneNumber) || otpResendTimer > 0)
      return;

    setLoading(true);
    setApiError("");

    try {
      await authService.reSendOTP({
        identifier: registeredUser.email ?? registeredUser.phoneNumber,
        type: registeredUser.email
          ? "EMAIL_VERIFICATION"
          : "PHONE_VERIFICATION",
      });

      setOtpResendTimer(60);
    } catch (err: any) {
      setApiError(
        err.response?.data?.message ||
        "Could not resend OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────
  // USER CODE CHANGE
  // ─────────────────────────────────────
  const onUserCodeChange = (value: string) => {
    const sanitized = value
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 20);

    setCustomUserCode(sanitized);

    if (sanitized.length < 4) {
      setUserCodeStatus("invalid");
      return;
    }

    if (!registeredUser?.id) {
      setUserCodeStatus("invalid");
      return;
    }

    if (sanitized === registeredUser?.userCode) {
      setUserCodeStatus("idle");
      return;
    }

    setUserCodeStatus("checking");

    if (debounceRef.current)
      clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const isAvailableData =
          await authService.checkUserId({
            code: sanitized,
            userId: registeredUser?.id,
          });

        setUserCodeStatus(
          isAvailableData?.success ? "available" : "taken"
        );
      } catch {
        setUserCodeStatus("taken");
      }
    }, 600);
  };

  // ─────────────────────────────────────
  // SAVE USER CODE
  // ─────────────────────────────────────
  const onSaveUserCode = async () => {
    if (!registeredUser) return;

    if (
      customUserCode === registeredUser.userCode
    ) {
      setStep("success");
      return;
    }

    if (userCodeStatus !== "available") return;

    setUserCodeSaving(true);
    setApiError("");

    try {
      await authService.updateUserId({
        userId: registeredUser.id,
        code: customUserCode,
      });

      setStep("success");
    } catch (err: any) {
      setApiError(
        err.response?.data?.message ||
        "Could not save User ID."
      );
    } finally {
      setUserCodeSaving(false);
    }
  };

  // ─────────────────────────────────────
  // LEFT PANEL
  // ─────────────────────────────────────
  const LeftPanel = (
    <Col xs={24} md={10} className="auth-panel">
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="auth-panel__leaf">🌱</div>

        <Title
          level={2}
          style={{
            color: "white",
            marginTop: "20px",
          }}
        >
          Join the Divantraa Family
        </Title>

        <Text
          style={{
            color: "white",
            display: "block",
          }}
        >
          Create a free account and start your
          wellness journey with 50,000+ happy
          customers.
        </Text>
      </div>
    </Col>
  );

  // ─────────────────────────────────────
  // STEP 2 OTP
  // ─────────────────────────────────────
  if (step === "otp") {
    return (
      <Row
        className="auth-page auth-main"
        style={{ minHeight: "100vh" }}
      >
        {LeftPanel}

        <Col
          xs={24}
          md={14}
          className="auth-card-wrapper"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <Card
            className="auth-card"
            style={{
              width: "100%",
              maxWidth: "520px",
            }}
          >
            <div className="auth-card__top">
              <div className="auth-success__ring">
                🔐
              </div>

              <Title level={3}>
                Verify Your Email
              </Title>

              <Text type="secondary">
                Enter the 6-digit verification code
                sent to
              </Text>

              <div
                style={{
                  marginTop: 6,
                  fontWeight: 600,
                }}
              >
                {registeredUser?.email}
              </div>
            </div>

            {apiError && (
              <Alert
                message={apiError}
                type="error"
                showIcon
                style={{ marginBottom: 20 }}
              />
            )}

            <Form
              form={otpForm}
              layout="vertical"
              onFinish={onVerifyOtp}
              requiredMark={false}
            >
              <Form.Item
                name="otp"
                rules={[
                  {
                    required: true,
                    message:
                      "Please enter the OTP",
                  },
                  {
                    len: 6,
                    message:
                      "OTP must be 6 digits",
                  },
                ]}
              >
                <Input.OTP
                  length={6}
                  size="large"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                  }}
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{
                  backgroundColor: "#0c5b47",
                  height: 48,
                  marginTop: 12,
                }}
              >
                Verify & Continue →
              </Button>
            </Form>

            <div
              style={{
                textAlign: "center",
                marginTop: 18,
              }}
            >
              {otpResendTimer > 0 ? (
                <Text type="secondary">
                  Resend OTP in{" "}
                  <strong>
                    {otpResendTimer}s
                  </strong>
                </Text>
              ) : (
                <Button
                  type="link"
                  onClick={onResendOtp}
                  loading={loading}
                >
                  Resend OTP
                </Button>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  // ─────────────────────────────────────
  // STEP 3 USER ID
  // ─────────────────────────────────────
  if (step === "userid") {
    return (
      <Row
        className="auth-page auth-main"
        style={{ minHeight: "100vh" }}
      >
        {LeftPanel}

        <Col
          xs={24}
          md={14}
          className="auth-card-wrapper"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <Card
            className="auth-card"
            style={{
              width: "100%",
              maxWidth: "540px",
            }}
          >
            <div className="auth-card__top">
              <div className="auth-success__ring">
                👤
              </div>

              <Title level={3}>
                Choose Your User ID
              </Title>

              <Text type="secondary">
                This will be your unique identity
                inside Divantraa.
              </Text>
            </div>

            {apiError && (
              <Alert
                message={apiError}
                type="error"
                showIcon
                style={{ marginBottom: 20 }}
              />
            )}

            <div style={{ marginBottom: 24 }}>
              <Text
                strong
                style={{
                  display: "block",
                  marginBottom: 8,
                }}
              >
                User ID
              </Text>

              <Input
                placeholder="Enter custom ID"
                size="large"
                value={customUserCode}
                onChange={(e) =>
                  onUserCodeChange(
                    e.target.value
                  )
                }
                status={
                  userCodeStatus === "taken" ||
                    userCodeStatus === "invalid"
                    ? "error"
                    : ""
                }
                style={{
                  textTransform: "uppercase",
                  height: 48,
                }}
              />

              <div
                style={{
                  marginTop: 10,
                  minHeight: 24,
                }}
              >
                {userCodeStatus ===
                  "checking" && (
                    <Text type="secondary">
                      Checking availability...
                    </Text>
                  )}

                {userCodeStatus ===
                  "available" && (
                    <Text type="success">
                      ✓ User ID is available
                    </Text>
                  )}

                {userCodeStatus ===
                  "taken" && (
                    <Text type="danger">
                      ✗ User ID already taken
                    </Text>
                  )}

                {userCodeStatus ===
                  "invalid" && (
                    <Text type="warning">
                      Minimum 4 characters required
                    </Text>
                  )}
              </div>
            </div>

            <Button
              type="primary"
              block
              size="large"
              loading={userCodeSaving}
              disabled={
                userCodeStatus !==
                "available" &&
                customUserCode !==
                registeredUser?.userCode
              }
              onClick={onSaveUserCode}
              style={{
                backgroundColor: "#0c5b47",
                height: 48,
              }}
            >
              Finish Registration →
            </Button>

            <div
              style={{
                textAlign: "center",
                marginTop: 16,
              }}
            >
              <Button
                type="link"
                onClick={() =>
                  setStep("success")
                }
              >
                Skip for now
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  // ─────────────────────────────────────
  // STEP 4: SUCCESS
  // ─────────────────────────────────────
  if (step === "success") {
    return (
      <Row className="auth-page auth-main" style={{ minHeight: "100vh" }}>
        {LeftPanel}
        <Col
          xs={24}
          md={14}
          className="auth-card-wrapper"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <Card className="auth-card" style={{ width: "100%", maxWidth: "550px", textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
            <Title level={2}>Account Created!</Title>
            <Text style={{ fontSize: 16, display: 'block', marginBottom: 24 }}>
              Your registration is complete. Welcome to Divantraa!
            </Text>
            <Button
              type="primary"
              block
              size="large"
              onClick={() => navigate("/login")}
              style={{ backgroundColor: "#0c5b47" }}
            >
              Go to Login
            </Button>
          </Card>
        </Col>
      </Row>
    );
  }

  // ─────────────────────────────────────
  // MAIN REGISTER FORM
  // ─────────────────────────────────────
  return (
    <Row
      className="auth-page auth-main"
      style={{ minHeight: "100vh" }}
    >
      {LeftPanel}

      <Col
        xs={24}
        md={14}
        className="auth-card-wrapper"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <Card
          className="auth-card"
          style={{
            width: "100%",
            maxWidth: "550px",
          }}
        >
          <div
            className="auth-card__top"
            style={{
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            <Title
              level={3}
              style={{
                marginBottom: 4,
              }}
            >
              Create Account
            </Title>

            <Text
              type="secondary"
              style={{
                fontSize: 13,
              }}
            >
              Join 50,000+ happy customers
            </Text>
          </div>

          {apiError && (
            <Alert
              message={apiError}
              type="error"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true }]}
                >
                  <Input
                    placeholder="First Name"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true }]}
                >
                  <Input
                    placeholder="Last Name"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Email"
                  name="email"
                >
                  <Input
                    placeholder="you@example.com"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Phone"
                  name="phone"
                >
                  <Input
                    placeholder="+91 9999999999"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                {
                  required: true,
                  min: 8,
                },
              ]}
            >
              <Input.Password
                placeholder="Min. 8 characters"
                size="large"
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />
            </Form.Item>

            {/* PASSWORD STRENGTH */}
            {password && (
              <div
                style={{
                  marginTop: -12,
                  marginBottom: 16,
                }}
              >
                <Progress
                  percent={
                    passwordStrength.percent
                  }
                  showInfo={false}
                  strokeColor={
                    passwordStrength.color
                  }
                  size="small"
                  status={
                    passwordStrength.status
                  }
                />

                <Text
                  style={{
                    fontSize: 12,
                    color:
                      passwordStrength.color,
                  }}
                >
                  Password Strength:{" "}
                  {passwordStrength.text}
                </Text>
              </div>
            )}
            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      !value ||
                      getFieldValue(
                        "password"
                      ) === value
                    ) {
                      return Promise.resolve();
                    }

                    return Promise.reject(
                      new Error(
                        "Passwords do not match!"
                      )
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Repeat password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="agree"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(
                        new Error(
                          "Accept terms to continue"
                        )
                      ),
                },
              ]}
            >
              <Checkbox>
                I agree to the{" "}
                <Link to="/terms">
                  Terms
                </Link>{" "}
                &{" "}
                <Link to="/privacy">
                  Privacy Policy
                </Link>
              </Checkbox>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{
                backgroundColor: "#0c5b47",
              }}
            >
              Create My Account →
            </Button>
          </Form>

          <Divider plain style={{ margin: "20px 0" }}>
            <Text
              type="secondary"
              style={{ fontSize: "12px" }}
            >
              or continue with
            </Text>
          </Divider>

          <div className="auth-social-row">
            <Row gutter={12}>
              <Col span={12}>
                <Button
                  block
                  icon={
                    <b
                      style={{
                        color: "#e44",
                        marginRight: 6,
                      }}
                    >
                      G
                    </b>
                  }
                >
                  Continue with Google
                </Button>
              </Col>

              <Col span={12}>
                <Button
                  block
                  icon={
                    <b
                      style={{
                        color: "#1877f2",
                        marginRight: 6,
                      }}
                    >
                      f
                    </b>
                  }
                >
                  Continue with Facebook
                </Button>
              </Col>
            </Row>
          </div>

          <Text
            style={{
              display: "block",
              textAlign: "center",
              marginTop: 20,
            }}
          >
            Already have an account?{" "}
            <Link to="/login">
              Sign In
            </Link>
          </Text>
        </Card>
      </Col>
    </Row>
  );
}