import IndentForm from '../IndentForm';

export default function IndentFormExample() {
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <IndentForm 
        onSubmit={(data) => console.log("Submitted:", data)}
        onDraft={(data) => console.log("Saved as draft:", data)}
      />
    </div>
  );
}