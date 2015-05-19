var Vex = require('vexflow');
var teoria = require('teoria');
var zazate = require('zazate.js');

var canvas = document.getElementById('chord');

var currNotes = [];

function displayChord(name, notes) {
  console.log(name);
  var ctx = Vex.Flow.Renderer.buildContext(canvas,
    Vex.Flow.Renderer.Backends.CANVAS, canvas.width, canvas.height);
  /*var renderer = new Vex.Flow.Renderer(canvas,
    Vex.Flow.Renderer.Backends.CANVAS);*/

  //var ctx = renderer.getContext();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(1, 1);

  var stave = new Vex.Flow.Stave(10, 0, 500);
  stave.addClef('treble').setContext(ctx).draw();

  var snotes = [];
  if (notes.length > 0) {
    var note = new Vex.Flow.StaveNote({
      keys: getKeys(notes),
      duration: 'q'
    });

    notes.forEach(function(n, i) {
      var accidental = n.accidental();
      if (accidental !== '') {
        if (accidental === 'x') {
          accidental = '##';
        }

        note.addAccidental(i, new Vex.Flow.Accidental(accidental));
      }
    });

    snotes.push(note);
  }

  Vex.Flow.Formatter.FormatAndDraw(ctx, stave, snotes);

  // ctx.drawText(name);
}

function getKeys(notes) {
  return notes.map(function(note) {
    return note.name() + note.accidental() + '/' + note.octave();
  });
}

window.zazate = zazate;
function updateNotes(notes) {
  var chordName = zazate.chords.determine(notes);
  displayChord('', currNotes.map(function(note) {
    return teoria.note.fromMIDI(note);
  }));
  console.log(currNotes);
}

function onMidiMessage(event) {
  switch (event.data[0] & 0xf0) {
  case 0x90:
    if (event.data[2] !== 0) {
      currNotes.push(event.data[1]);
      updateNotes(currNotes);
      return;
    }

  case 0x80:
    var index = currNotes.indexOf(event.data[1]);
    if (index > -1) {
      currNotes.splice(index, 1);
      updateNotes(currNotes);
    }
  }
}

updateNotes([]);

navigator.requestMIDIAccess().then(function(midiAccess) {
  // For brevity, we are just assuming one MIDI device is connected
  var midiIn = midiAccess.inputs.values().next().value;

  midiIn.onmidimessage = onMidiMessage;
}, function() {
  console.error('MIDI access unavailable');
});
