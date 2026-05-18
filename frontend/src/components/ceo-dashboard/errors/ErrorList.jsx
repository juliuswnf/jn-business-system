import ErrorListItem from './ErrorListItem';

export default function ErrorList({ errors, selectedErrorId, onSelect, formatTimestamp }) {
  return (
    <div className="space-y-3">
      {errors.map((error) => (
        <ErrorListItem
          key={error.id}
          error={error}
          isSelected={selectedErrorId === error.id}
          onSelect={onSelect}
          formatTimestamp={formatTimestamp}
        />
      ))}
    </div>
  );
}
