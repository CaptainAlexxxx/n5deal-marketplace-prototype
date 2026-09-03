import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in | N5Deal" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={next ?? "/"} />;
}
