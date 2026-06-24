package com.sms.dto;

import java.util.List;

public class StudentStatsResponse {

    private long totalStudents;
    private long uniqueMajors;
    private List<String> majors;

    public StudentStatsResponse(long totalStudents, long uniqueMajors, List<String> majors) {
        this.totalStudents = totalStudents;
        this.uniqueMajors = uniqueMajors;
        this.majors = majors;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public long getUniqueMajors() {
        return uniqueMajors;
    }

    public List<String> getMajors() {
        return majors;
    }
}
