export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-green-50 via-khaki-50 to-cream-green-100 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

