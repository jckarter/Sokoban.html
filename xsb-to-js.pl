#!/usr/bin/perl -w

die "Usage: $0 in.txt out.js 'Title'\n"
    if($#ARGV < 2);

open IN_SOKOBAN, $ARGV[0]
    or die "Unable to open $ARGV[0]: $!\n";
open OUT_JS, ">$ARGV[1]"
    or die "Unable to open $ARGV[1]: $!\n";
    
$SET_TITLE = $ARGV[2];

print OUT_JS <<END_of_start_boilerplate;
gSokobanPuzzles["$SET_TITLE"] = new Array(
    // 0 Metadata
    {
	author: "nobody",
	homepage: "http://example.com"
    },
END_of_start_boilerplate

@puzzleLines = ();
$puzzleNumber = 1;
while(<IN_SOKOBAN>) {
    if($_ !~ /^[\s#+.*\$@]+$/ || $_ =~ /^\s*$/) {		    # xcode perl highlighting is stupid, so correct it: '){
	if(@puzzleLines) {
	    outputPuzzle($puzzleNumber, @puzzleLines);
	    @puzzleLines = ();
	    ++$puzzleNumber;
	}
	next;
    }
    chomp;
    push @puzzleLines, $_;
}
outputPuzzle($puzzleNumber, @puzzleLines) if (@puzzleLines);

print OUT_JS <<END_of_end_boilerplate;
    // end placeholder
    null
);
END_of_end_boilerplate

close IN_SOKOBAN;
close OUT_JS;

exit 0;

sub outputPuzzle {
    my($puzzleNumber, @puzzleLines) = @_;
    print OUT_JS <<END_of_start_puzzle;
    // $puzzleNumber
    new Array(
END_of_start_puzzle
    for(my $i = 0; $i <= $#puzzleLines; ++$i) {
	$puzzleLines[$i] =~ /^(.*?)\s*$/;
	print OUT_JS qq/\t"$1"/;
	print OUT_JS "," if($i != $#puzzleLines);
	print OUT_JS "\n";
    }
    print OUT_JS "    ),\n";
}
