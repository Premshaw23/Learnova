export default function StudyAILayout({ children }) {
  return (
    <>
      <style>{`
        body { overflow: hidden; }
        footer, nav, header { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
