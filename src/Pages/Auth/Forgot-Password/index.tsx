import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Row, Col, Typography, Card, Alert, Steps } from "antd";
import { MailOutlined, LockOutlined, SafetyOutlined } from "@ant-design/icons";
import "../auth.css";
import { authService } from "../auth.service";

const { Title, Text } = Typography;

export default function ForgotPassword() {
  const [step, setStep] = useState<number>(0);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [apiAlert, setApiAlert] = useState<{ type: "error" | "success"; msg: string } | null>(null);
  const navigate = useNavigate();

  // ─────────────────────────────────────
  // OTP TIMER
  // ─────────────────────────────────────
  useEffect(() => {
    if (otpResendTimer <= 0) return;

    const timer = setTimeout(() => {
      setOtpResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [otpResendTimer]);

  // ── Original logic (unchanged) ──────────────────────────────────────────
  const onEmailSubmit = async (values: { identifier: string }) => {
    setLoading(true);
    setApiAlert(null);
    try {
      await authService.forgotPassword(values.identifier);
      setIdentifier(values.identifier);
      setOtpResendTimer(60);
      setStep(1);
    } catch (err: any) {
      setApiAlert({ type: "error", msg: err.response?.data?.message || "Failed to send OTP." });
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────
  // RESEND OTP
  // ─────────────────────────────────────
  const onResendOtp = async () => {
    if (!identifier || otpResendTimer > 0) return;

    setLoading(true);
    setApiAlert(null);

    try {
      await authService.reSendOTP({
        identifier,
        type: "PASSWORD_RESET",
      });

      setOtpResendTimer(60);

      setApiAlert({
        type: "success",
        msg: "OTP resent successfully",
      });
    } catch (err: any) {
      setApiAlert({
        type: "error",
        msg:
          err.response?.data?.message ||
          "Could not resend OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onOtpVerify = async (values: { otp: string }) => {
    setOtp(values.otp);
    setStep(2);
  };

  const onResetPassword = async (values: any) => {
    setLoading(true);
    setApiAlert(null);
    try {
      await authService.resetPassword({ identifier, otp, ...values });
      setStep(3);
    } catch (err: any) {
      setApiAlert({ type: "error", msg: err.response?.data?.message || "Reset failed." });
    } finally {
      setLoading(false);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  const renderDecorativePanel = () => (
    <Col xs={24} md={10} className="auth-panel">
      <div
        style={{
          padding: "48px 40px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="auth-card__icon"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            margin: "0 auto 22px",
            backdropFilter: "blur(8px)",
          }}
        >
          <SafetyOutlined style={{ fontSize: "28px", color: "white" }} />
        </div>

        <Title
          level={2}
          style={{
            color: "white",
            marginTop: "4px",
            marginBottom: "12px",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 3vw, 32px)",
            letterSpacing: "-0.3px",
          }}
        >
          Secure Recovery
        </Title>

        <Text
          style={{
            color: "rgba(255,255,255,0.82)",
            display: "block",
            fontSize: "14px",
            lineHeight: "1.7",
            maxWidth: "260px",
            margin: "0 auto",
          }}
        >
          Follow the simple steps to regain access to your Divantraa account and continue your wellness journey.
        </Text>

        {/* Step hints */}
        <div
          style={{
            marginTop: "36px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            textAlign: "left",
            maxWidth: "220px",
            margin: "36px auto 0",
          }}
        >
          {[
            { icon: "✉️", label: "Enter your email" },
            { icon: "🔐", label: "Verify with OTP" },
            { icon: "🔑", label: "Set new password" },
          ].map(({ icon, label }, i) => (
            <div
              key={label}
              className="auth-panel__feature"
              style={{
                opacity: step >= i ? 1 : 0.45,
                transition: "opacity 0.4s ease",
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background:
                    step > i
                      ? "rgba(255,255,255,0.3)"
                      : step === i
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  flexShrink: 0,
                  transition: "background 0.4s ease",
                }}
              >
                {step > i ? "✓" : icon}
              </span>
              <span style={{ fontSize: "13px" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Col>
  );

  /* ── Step 3: Success ── */
  if (step === 3) {
    return (
      <Row className="auth-page auth-main" style={{ minHeight: "100vh" }}>
        {renderDecorativePanel()}
        <Col
          xs={24}
          md={14}
          className="auth-card-wrapper"
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Card className="auth-card" style={{ width: "100%", maxWidth: "480px" }}>
            <div className="auth-success">
              <div className="auth-success__ring">✓</div>
              <h2 className="auth-success__title">Password Reset!</h2>
              <p className="auth-success__text">
                Your password has been changed successfully. You're all set to sign back in.
              </p>
              <Button
                type="primary"
                block
                size="large"
                onClick={() => navigate("/login")}
                style={{ marginTop: 4 }}
              >
                Back to Sign In →
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  /* ── Steps 0 – 2 ── */
  return (
    <Row className="auth-page auth-main" style={{ minHeight: "100vh" }}>
      {renderDecorativePanel()}

      <Col
        xs={24}
        md={14}
        className="auth-card-wrapper"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Card className="auth-card" style={{ width: "100%", maxWidth: "500px" }}>
          {/* Steps indicator */}
          <div style={{ marginBottom: 36 }}>
            <Steps
              current={step}
              size="small"
              items={[{ title: "Email" }, { title: "Verify" }, { title: "Reset" }]}
            />
          </div>

          {/* Alert */}
          {apiAlert && (
            <Alert
              message={apiAlert.msg}
              type={apiAlert.type}
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* ── Step 0: Email ── */}
          {step === 0 && (
            <>
              <div className="auth-card__top">
                <div className="auth-card__icon">
                  <MailOutlined style={{ fontSize: "24px", color: "var(--g-500)" }} />
                </div>
                <Title level={2} className="auth-card__title">
                  Forgot Password?
                </Title>
                <Text className="auth-card__subtitle">
                  Enter your user id, email or phone and we'll send you a verification code.
                </Text>
              </div>

              <Form layout="vertical" onFinish={onEmailSubmit} requiredMark={false}>
                <Form.Item
                  label="UserID / Email or Phone"
                  name="identifier"
                  rules={[
                    {
                      required: true,
                      message:
                        "Please enter userid, email or phone number",
                    },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="UserID / Email or phone number"
                    size="large"
                  />
                </Form.Item>

                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  Send Verification Code →
                </Button>
              </Form>
            </>
          )}

          {/* ── Step 1: OTP ── */}
          {step === 1 && (
            <>
              <div className="auth-card__top">
                <div className="auth-card__icon">
                  <span style={{ fontSize: "26px" }}>📬</span>
                </div>
                <Title level={2} className="auth-card__title">
                  Check Your Email or Phone
                </Title>
                <Text className="auth-card__subtitle">
                  We sent a 6-digit code to{" "}
                  <strong style={{ color: "var(--g-500)" }}>{identifier}</strong>
                </Text>
              </div>

              <Form layout="vertical" onFinish={onOtpVerify} requiredMark={false}>
                <Form.Item
                  name="otp"
                  label="Verification Code"
                  rules={[
                    {
                      required: true,
                      message: "Enter the 6-digit OTP",
                    },
                  ]}
                >
                  <Input.OTP
                    length={6}
                    size="large"
                    formatter={(str) => str.toUpperCase()}
                    style={{
                      width: "100%",
                      // justifyContent: "center",
                      gap: "10px",
                    }}
                  />
                </Form.Item>

                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  Verify Code →
                </Button>
              </Form>

              <div
                className="auth-resend-row"
                style={{
                  marginTop: "20px",
                  textAlign: "center",
                }}
              >
                {otpResendTimer > 0 ? (
                  <Text type="secondary">
                    Resend OTP in{" "}
                    <strong>{otpResendTimer}s</strong>
                  </Text>
                ) : (
                  <Button
                    type="link"
                    onClick={onResendOtp}
                    loading={loading}
                    className="auth-resend-btn"
                  >
                    Resend Code
                  </Button>
                )}
              </div>
            </>
          )}

          {/* ── Step 2: New Password ── */}
          {step === 2 && (
            <>
              <div className="auth-card__top">
                <div className="auth-card__icon">
                  <LockOutlined style={{ fontSize: "24px", color: "var(--g-500)" }} />
                </div>
                <Title level={2} className="auth-card__title">
                  New Password
                </Title>
                <Text className="auth-card__subtitle">
                  Choose a strong password to keep your account secure.
                </Text>
              </div>

              <Form layout="vertical" onFinish={onResetPassword} requiredMark={false}>
                <Form.Item
                  name="newPassword"
                  label="New Password"
                  rules={[
                    { required: true, message: "Please enter a new password" },
                    { min: 8, message: "Password must be at least 8 characters" },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Minimum 8 characters"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  dependencies={["newPassword"]}
                  rules={[
                    { required: true, message: "Please confirm your password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("newPassword") === value)
                          return Promise.resolve();
                        return Promise.reject(new Error("Passwords do not match!"));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Re-enter password"
                    size="large"
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                >
                  Reset Password →
                </Button>
              </Form>
            </>
          )}

          {/* Back link */}
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <Link to="/login" className="auth-back">
              ← Back to Sign In
            </Link>
          </div>
        </Card>
      </Col>
    </Row>
  );
}