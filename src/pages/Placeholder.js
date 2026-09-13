import "./placeholder.css";

function Placeholder({ title }) {
  return (
    <div className="page-with-sidebar">
      <div className="placeholder-box">
        <h2>{title}</h2>
        <p>این بخش در حال توسعه است.</p>
      </div>
    </div>
  );
}

export default Placeholder;
