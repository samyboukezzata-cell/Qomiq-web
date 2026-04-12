export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-[#0d9488] flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Qomiq</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Intelligence Commerciale PME</p>
        </div>
        {children}
      </div>
    </div>
  );
}
