import React from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";

import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Card,
  Alert,
  Divider,
} from "antd";

import {
  MailOutlined,
  LockOutlined,
  GoogleOutlined,
  FacebookFilled,
  SafetyCertificateOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";

import "../auth.css";
import { authService } from "../auth.service";

const { Title, Text } = Typography;

type Step = "login" | "otp" | "success";

export default function Login() {
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();

  const navigate = useNavigate();

  const [step, setStep] =
    React.useState<Step>("login");

  const [loading, setLoading] =
    React.useState(false);

  const [otpLoading, setOtpLoading] =
    React.useState(false);

  const [apiError, setApiError] =
    React.useState("");

  const [tempUser, setTempUser] =
    React.useState<{
      userId: string;
      identifier: string;
      password: string;
    } | null>(null);

  // ─────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────
  const onFinish = async (values: any) => {
    setApiError("");
    setLoading(true);

    try {
      const response =
        await authService.loginWithOTP(values);

      if (response?.requiresOTP) {
        setTempUser({
          userId: response.userId,
          identifier: values.identifier,
          password: values.password,
        });

        setStep("otp");
        return;
      }

      setStep("success");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      setApiError(
        err.response?.data?.message ||
          "Invalid credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────
  // VERIFY OTP
  // ─────────────────────────────────────
  const onVerifyOTP = async (
    values: any
  ) => {
    if (!tempUser) return;

    setApiError("");
    setOtpLoading(true);

    try {
      await authService.verifyLoginOTP({
        identifier: tempUser.identifier,
        userId: tempUser.userId,
        otp: values.otp,
        password: tempUser.password,
      });

      setStep("success");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      setApiError(
        err.response?.data?.message ||
          "Invalid or expired OTP."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // ─────────────────────────────────────
  // SOCIAL LOGIN
  // ─────────────────────────────────────
  const handleGoogleLogin = () => {
    // Google login
  };

  const handleFacebookLogin = () => {
    // Facebook login
  };

  // ─────────────────────────────────────
  // LEFT PANEL
  // ─────────────────────────────────────
  const LeftPanel = (
    <Col
      xs={24}
      md={10}
      className="auth-panel"
    >
      <div
        style={{
          padding: "48px 40px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="auth-panel__leaf">
          {step === "login" && "🌿"}
          {step === "otp" && "🔐"}
          {step === "success" && "✅"}
        </div>

        <Title
          level={2}
          style={{
            color: "white",
            marginTop: "20px",
            marginBottom: "10px",
            fontFamily:
              "var(--font-display)",
            fontSize:
              "clamp(26px, 3vw, 34px)",
            letterSpacing: "-0.3px",
          }}
        >
          {step === "otp"
            ? "OTP Verification"
            : step === "success"
            ? "Authentication Complete"
            : "Welcome Back"}
        </Title>

        <Text
          style={{
            color:
              "rgba(255,255,255,0.82)",
            display: "block",
            fontSize: "14px",
            lineHeight: "1.7",
            maxWidth: "280px",
            margin: "0 auto",
          }}
        >
          {step === "otp"
            ? "Enter the secure verification code sent to your account."
            : step === "success"
            ? "Preparing your personalized dashboard experience."
            : "Sign in to explore our range of pure, natural wellness products crafted with care."}
        </Text>

        {step === "login" && (
          <div
            className="auth-panel__features"
            style={{
              marginTop: "32px",
              textAlign: "left",
              display: "inline-block",
            }}
          >
            {[
              "100% Natural Ingredients",
              "Trusted by 50,000+ Customers",
              "Fast & Secure Checkout",
            ].map((f) => (
              <div
                key={f}
                className="auth-panel__feature"
              >
                <span className="auth-panel__check">
                  ✓
                </span>

                <span>{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "-30px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border:
              "1px solid rgba(255,255,255,0.07)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "-20px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            border:
              "1px solid rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        />
      </div>
    </Col>
  );

  // ─────────────────────────────────────
  // OTP STEP
  // ─────────────────────────────────────
  if (step === "otp") {
    return (
      <Row
        className="auth-page auth-main"
        style={{
          minHeight: "100vh",
        }}
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
            padding: 20,
          }}
        >
          <Card
            className="auth-card"
            style={{
              width: "100%",
              maxWidth: "480px",
            }}
          >
            <div className="auth-card__top">
              <div className="auth-success__ring">
                <SafetyCertificateOutlined />
              </div>

              <Title level={2}>
                Verify OTP
              </Title>

              <Text type="secondary">
                Enter the 6-digit code sent to
                your email or phone.
              </Text>
            </div>

            {apiError && (
              <Alert
                message={apiError}
                type="error"
                showIcon
                style={{
                  marginBottom: 24,
                }}
              />
            )}

            <Form
              form={otpForm}
              layout="vertical"
              onFinish={onVerifyOTP}
            >
              <Form.Item
                name="otp"
                label="OTP"
                rules={[
                  {
                    required: true,
                    message:
                      "Please enter OTP",
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
                  formatter={(str) =>
                    str.toUpperCase()
                  }
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={otpLoading}
              >
                Verify & Login →
              </Button>
            </Form>

            <Text
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 18,
              }}
            >
              <Button
                type="link"
                onClick={() => {
                  setApiError("");
                  setStep("login");
                }}
              >
                ← Back to Login
              </Button>
            </Text>
          </Card>
        </Col>
      </Row>
    );
  }

  // ─────────────────────────────────────
  // SUCCESS STEP
  // ─────────────────────────────────────
  if (step === "success") {
    return (
      <Row
        className="auth-page auth-main"
        style={{
          minHeight: "100vh",
        }}
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
            padding: 20,
          }}
        >
          <Card
            className="auth-card"
            style={{
              width: "100%",
              maxWidth: "480px",
            }}
          >
            <div className="auth-success">
              <div className="auth-success__ring">
                <CheckCircleFilled />
              </div>

              <Title className="auth-success__title">
                Login Successful
              </Title>

              <Text className="auth-success__text">
                Welcome back! Preparing your
                dashboard...
              </Text>

              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div className="auth-loader" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  // ─────────────────────────────────────
  // LOGIN STEP
  // ─────────────────────────────────────
  return (
    <Row
      className="auth-page auth-main"
      style={{
        minHeight: "100vh",
      }}
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
          padding: 20,
        }}
      >
        <Card
          className="auth-card"
          style={{
            width: "100%",
            maxWidth: "480px",
          }}
        >
          {/* Header */}
          <div className="auth-card__top">
            <div className="auth-card__icon">
              <span
                style={{
                  fontSize: "28px",
                }}
              >
                🌿
              </span>
            </div>

            <Title
              level={2}
              className="auth-card__title"
            >
              Sign In
            </Title>

            <Text className="auth-card__subtitle">
              Access your Divantraa account
            </Text>
          </div>

          {/* Error */}
          {apiError && (
            <Alert
              message={apiError}
              type="error"
              showIcon
              style={{
                marginBottom: 24,
              }}
            />
          )}

          {/* Login Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              label="User ID / Email or Phone"
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

            <Form.Item
              label="Password"
              name="password"
              rules={[
                {
                  required: true,
                  message:
                    "Please input your password!",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                size="large"
              />
            </Form.Item>

            <div
              className="auth-forgot-row"
              style={{
                textAlign: "right",
                marginBottom: "12px",
                marginTop: "-8px",
              }}
            >
              <Link to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <Form.Item
              style={{
                marginBottom: 0,
              }}
            >
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                Sign In →
              </Button>
            </Form.Item>
          </Form>

          {/* Divider */}
          <Divider
            plain
            style={{
              margin: "28px 0",
            }}
          >
            <Text
              type="secondary"
              style={{
                fontSize: "12px",
              }}
            >
              or continue with
            </Text>
          </Divider>

          {/* Social Login */}
          <div className="auth-social-row">
            <Row gutter={12}>
              <Col span={12}>
                <Button
                  block
                  size="large"
                  icon={<GoogleOutlined />}
                  onClick={
                    handleGoogleLogin
                  }
                >
                  Google
                </Button>
              </Col>

              <Col span={12}>
                <Button
                  block
                  size="large"
                  icon={<FacebookFilled />}
                  onClick={
                    handleFacebookLogin
                  }
                >
                  Facebook
                </Button>
              </Col>
            </Row>
          </div>

          {/* Bottom */}
          <p className="auth-bottom-text">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="auth-bottom-link"
            >
              Create one free
            </Link>
          </p>
        </Card>
      </Col>
    </Row>
  );
}