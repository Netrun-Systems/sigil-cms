interface LoadingFallbackProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function LoadingFallback({ 
  message = "Loading...", 
  size = 'md',
  fullScreen = false 
}: LoadingFallbackProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const containerClasses = fullScreen 
    ? "min-h-screen bg-netrun-white flex items-center justify-center"
    : "flex items-center justify-center py-8";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div 
          className={`${sizeClasses[size]} border-4 border-netrun-green border-t-transparent rounded-full animate-spin mx-auto mb-4`}
          role="status"
          aria-label="Loading"
        />
        <p className="text-gray-600 font-futura-medium">{message}</p>
      </div>
    </div>
  );
}

export function PageLoadingFallback({ message = "Loading page..." }: { message?: string }) {
  return <LoadingFallback message={message} size="lg" fullScreen />;
}

export function ComponentLoadingFallback({ message = "Loading..." }: { message?: string }) {
  return <LoadingFallback message={message} size="md" />;
}