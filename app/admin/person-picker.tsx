"use client";

import { useEffect, useId, useState } from "react";
import { Person, personKey } from "../lib/tournament";

type Props = {
  people: Person[];
  value: string;
  blocked: string[];
  onChange: (id: string) => void;
  label: string;
  required?: boolean;
};

export default function PersonPicker({ people, value, blocked, onChange, label, required = false }: Props) {
  const listId = useId();
  const selectedName = people.find(person => person.id === value)?.name ?? "";
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  useEffect(() => {
    if (value) {
      setQuery(selectedName);
      setEditing(false);
    }
  }, [value, selectedName]);
  const matches = people.filter(person =>
    (!blocked.includes(person.id) || person.id === value) &&
    personKey(person.name).includes(personKey(editing ? query : selectedName))
  ).slice(0, 12);

  function choose(person: Person) {
    onChange(person.id);
    setQuery(person.name);
    setEditing(false);
    setOpen(false);
  }

  return <label className="person-picker">
    {label}
    <input
      aria-label={label}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={listId}
      aria-activedescendant={open && matches[highlighted] ? `${listId}-${highlighted}` : undefined}
      autoComplete="off"
      placeholder="Digite o nome da pessoa"
      required={required}
      value={editing ? query : selectedName}
      onFocus={() => {
        if (!editing) setQuery(selectedName);
        setEditing(true);
        setOpen(true);
        setHighlighted(0);
      }}
      onChange={event => {
        const text = event.target.value;
        setQuery(text);
        setEditing(true);
        setOpen(true);
        setHighlighted(0);
        const exact = people.find(person =>
          !blocked.includes(person.id) && personKey(person.name) === personKey(text)
        );
        onChange(exact?.id ?? "");
      }}
      onBlur={() => setOpen(false)}
      onKeyDown={event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          setOpen(true);
          setHighlighted(index => matches.length ?
            (index + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length : 0);
        } else if (event.key === "Enter" && open) {
          event.preventDefault();
          if (matches[highlighted]) choose(matches[highlighted]);
        } else if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
        }
      }}
    />
    {open && <div className="person-results" id={listId} role="listbox" aria-label={`Sugestões para ${label}`}>
      {matches.map((person, index) => <button
        key={person.id}
        id={`${listId}-${index}`}
        type="button"
        role="option"
        aria-selected={index === highlighted}
        tabIndex={-1}
        onPointerDown={event => event.preventDefault()}
        onClick={() => choose(person)}
      >{person.name}</button>)}
      {!matches.length && <span>Nenhuma pessoa encontrada</span>}
    </div>}
  </label>;
}
