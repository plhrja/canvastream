create table if not exists canvastream_recording (
  "id"            varchar not null primary key,
  "timestamp"     timestamp not null,
  "coordinate_x"  integer not null,
  "coordinate_y"  integer not null,
  "is_drawing"    boolean not null
)
distkey ("id")
sortkey("id")